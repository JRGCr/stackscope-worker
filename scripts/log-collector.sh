#!/bin/bash

# StackScope Log Collector with Health Monitoring
# Automatically stops collection if worker becomes unreachable

WORKER_URL="https://stackscope-worker.blackbaysolutions.workers.dev"
LOG_FILE="logs/stackscope.ndjson"
PID_FILE="logs/.collector.pid"

start_collector() {
    echo "Starting StackScope log collection..."
    mkdir -p logs
    
    # Check if already running
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        echo "Log collector already running (PID: $(cat $PID_FILE))"
        exit 1
    fi
    
    # Start health monitoring loop
    (
        while true; do
            # Check if worker is healthy
            if ! curl -s --max-time 10 "${WORKER_URL}/health" > /dev/null 2>&1; then
                echo "$(date): Worker health check failed, stopping log collection" >> logs/collector.log
                break
            fi
            
            # Start wrangler tail and monitor its health
            wrangler tail stackscope-worker --format json >> "$LOG_FILE" 2>/dev/null &
            WRANGLER_PID=$!
            
            # Wait a bit, then check if wrangler is still running
            sleep 30
            if ! kill -0 $WRANGLER_PID 2>/dev/null; then
                echo "$(date): Wrangler tail process died, restarting..." >> logs/collector.log
                continue
            fi
            
            # Kill wrangler before next health check
            kill $WRANGLER_PID 2>/dev/null
            wait $WRANGLER_PID 2>/dev/null
            
            sleep 5
        done
        
        # Cleanup
        rm -f "$PID_FILE"
        echo "$(date): Log collection stopped" >> logs/collector.log
    ) &
    
    # Save main process PID
    echo $! > "$PID_FILE"
    echo "Log collector started (PID: $!)"
}

stop_collector() {
    echo "Stopping StackScope log collection..."
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            # Kill the health monitoring process and its children
            pkill -P "$PID" 2>/dev/null
            kill "$PID" 2>/dev/null
            wait "$PID" 2>/dev/null
        fi
        rm -f "$PID_FILE"
    fi
    
    # Clean up any remaining wrangler processes
    pkill -f "wrangler tail stackscope-worker" 2>/dev/null
    
    echo "Log collection stopped"
}

status_collector() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        echo "Log collector is running (PID: $(cat $PID_FILE))"
        
        # Show recent activity
        if [ -f "logs/collector.log" ]; then
            echo "Recent activity:"
            tail -5 logs/collector.log
        fi
    else
        echo "Log collector is not running"
        rm -f "$PID_FILE" 2>/dev/null
    fi
}

case "$1" in
    start)
        start_collector
        ;;
    stop)
        stop_collector
        ;;
    status)
        status_collector
        ;;
    restart)
        stop_collector
        sleep 2
        start_collector
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart}"
        exit 1
        ;;
esac