/**
 * PerformanceMonitor - Tracks and logs performance metrics
 * Only active when enablePerfMonitoring is true
 */
export class PerformanceMonitor {
    private timers: Map<string, number> = new Map();
    private metrics: Map<string, number[]> = new Map();
    private enabled: boolean;

    constructor(enabled: boolean = false) {
        this.enabled = enabled;
    }

    /**
     * Start a performance timer
     * @param label - Description of what is being timed
     * @returns Timer ID for later reference
     */
    public startTimer(label: string): string {
        if (!this.enabled) {
            return '';
        }

        const id = `${label}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.timers.set(id, performance.now());
        return id;
    }

    /**
     * End a performance timer and record the metric
     * @param id - Timer ID from startTimer
     * @returns Elapsed time in milliseconds
     */
    public endTimer(id: string): number {
        if (!this.enabled || !id) {
            return 0;
        }

        const startTime = this.timers.get(id);
        if (!startTime) {
            console.warn(`PerformanceMonitor: Timer not found: ${id}`);
            return 0;
        }

        const elapsed = performance.now() - startTime;
        this.timers.delete(id);

        // Extract label from ID
        const label = id.split('-')[0];
        this.recordMetric(label, elapsed);

        return elapsed;
    }

    /**
     * Record a metric value
     * @param name - Metric name
     * @param value - Metric value
     */
    public recordMetric(name: string, value: number): void {
        if (!this.enabled) {
            return;
        }

        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }

        const values = this.metrics.get(name)!;
        values.push(value);

        // Keep only last 100 values per metric to prevent memory bloat
        if (values.length > 100) {
            values.shift();
        }
    }

    /**
     * Get all recorded metrics
     * @returns Map of metric names to value arrays
     */
    public getMetrics(): Map<string, number[]> {
        return new Map(this.metrics);
    }

    /**
     * Get statistics for a specific metric
     */
    public getMetricStats(name: string): { min: number; max: number; avg: number; count: number } | null {
        const values = this.metrics.get(name);
        if (!values || values.length === 0) {
            return null;
        }

        const min = Math.min(...values);
        const max = Math.max(...values);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;

        return { min, max, avg, count: values.length };
    }

    /**
     * Log performance summary to console
     */
    public logSummary(): void {
        if (!this.enabled) {
            return;
        }

        console.log('=== Performance Summary ===');
        
        for (const [name, values] of this.metrics.entries()) {
            if (values.length === 0) {
                continue;
            }

            const stats = this.getMetricStats(name);
            if (!stats) {
                continue;
            }

            console.log(`${name}:`);
            console.log(`  Count: ${stats.count}`);
            console.log(`  Avg: ${stats.avg.toFixed(2)}ms`);
            console.log(`  Min: ${stats.min.toFixed(2)}ms`);
            console.log(`  Max: ${stats.max.toFixed(2)}ms`);
        }

        console.log('==========================');
    }

    /**
     * Clear all recorded metrics
     */
    public clear(): void {
        this.metrics.clear();
        this.timers.clear();
    }

    /**
     * Enable or disable monitoring
     */
    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (!enabled) {
            this.clear();
        }
    }

    /**
     * Check if monitoring is enabled
     */
    public isEnabled(): boolean {
        return this.enabled;
    }
}
