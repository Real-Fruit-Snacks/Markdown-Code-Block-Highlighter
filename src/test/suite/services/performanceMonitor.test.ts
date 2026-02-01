import * as assert from 'assert';
import { PerformanceMonitor } from '../../../services/performanceMonitor';

suite('PerformanceMonitor Unit Tests', () => {
    let monitor: PerformanceMonitor;

    setup(() => {
        monitor = new PerformanceMonitor(true);
    });

    teardown(() => {
        monitor.clear();
    });

    test('Should create monitor with enabled state', () => {
        const enabledMonitor = new PerformanceMonitor(true);
        assert.strictEqual(enabledMonitor.isEnabled(), true);

        const disabledMonitor = new PerformanceMonitor(false);
        assert.strictEqual(disabledMonitor.isEnabled(), false);
    });

    test('Should start and end timer', () => {
        const timerId = monitor.startTimer('test-operation');
        
        assert.ok(timerId);
        assert.ok(timerId.includes('test-operation'));
        
        // Simulate some work
        const start = Date.now();
        while (Date.now() - start < 10) {
            // Wait 10ms
        }
        
        const elapsed = monitor.endTimer(timerId);
        assert.ok(elapsed >= 0);
    });

    test('Should return 0 elapsed time when disabled', () => {
        const disabledMonitor = new PerformanceMonitor(false);
        const timerId = disabledMonitor.startTimer('test');
        const elapsed = disabledMonitor.endTimer(timerId);
        
        assert.strictEqual(elapsed, 0);
    });

    test('Should record metrics', () => {
        monitor.recordMetric('test-metric', 100);
        monitor.recordMetric('test-metric', 200);
        monitor.recordMetric('test-metric', 150);
        
        const metrics = monitor.getMetrics();
        assert.ok(metrics.has('test-metric'));
        
        const values = metrics.get('test-metric');
        assert.ok(values);
        assert.strictEqual(values.length, 3);
        assert.strictEqual(values[0], 100);
        assert.strictEqual(values[1], 200);
        assert.strictEqual(values[2], 150);
    });

    test('Should not record metrics when disabled', () => {
        const disabledMonitor = new PerformanceMonitor(false);
        disabledMonitor.recordMetric('test-metric', 100);
        
        const metrics = disabledMonitor.getMetrics();
        assert.strictEqual(metrics.size, 0);
    });

    test('Should calculate metric statistics', () => {
        monitor.recordMetric('test-metric', 100);
        monitor.recordMetric('test-metric', 200);
        monitor.recordMetric('test-metric', 150);
        
        const stats = monitor.getMetricStats('test-metric');
        assert.ok(stats);
        assert.strictEqual(stats.min, 100);
        assert.strictEqual(stats.max, 200);
        assert.strictEqual(stats.avg, 150);
        assert.strictEqual(stats.count, 3);
    });

    test('Should return null stats for non-existent metric', () => {
        const stats = monitor.getMetricStats('non-existent');
        assert.strictEqual(stats, null);
    });

    test('Should clear all metrics', () => {
        monitor.recordMetric('metric1', 100);
        monitor.recordMetric('metric2', 200);
        
        const beforeClear = monitor.getMetrics();
        assert.ok(beforeClear.size > 0);
        
        monitor.clear();
        
        const afterClear = monitor.getMetrics();
        assert.strictEqual(afterClear.size, 0);
    });

    test('Should limit metric values to 100 entries', () => {
        // Record 150 values
        for (let i = 0; i < 150; i++) {
            monitor.recordMetric('test-metric', i);
        }
        
        const metrics = monitor.getMetrics();
        const values = metrics.get('test-metric');
        
        assert.ok(values);
        assert.strictEqual(values.length, 100); // Should be capped at 100
        
        // Should keep the last 100 values
        assert.strictEqual(values[0], 50); // First value should be from iteration 50
        assert.strictEqual(values[99], 149); // Last value should be from iteration 149
    });

    test('Should enable and disable monitoring', () => {
        assert.strictEqual(monitor.isEnabled(), true);
        
        monitor.setEnabled(false);
        assert.strictEqual(monitor.isEnabled(), false);
        
        monitor.setEnabled(true);
        assert.strictEqual(monitor.isEnabled(), true);
    });

    test('Should clear metrics when disabled', () => {
        monitor.recordMetric('test-metric', 100);
        assert.ok(monitor.getMetrics().size > 0);
        
        monitor.setEnabled(false);
        assert.strictEqual(monitor.getMetrics().size, 0);
    });

    test('Should handle multiple concurrent timers', () => {
        const timer1 = monitor.startTimer('operation-1');
        const timer2 = monitor.startTimer('operation-2');
        const timer3 = monitor.startTimer('operation-3');
        
        assert.notStrictEqual(timer1, timer2);
        assert.notStrictEqual(timer2, timer3);
        
        const elapsed1 = monitor.endTimer(timer1);
        const elapsed2 = monitor.endTimer(timer2);
        const elapsed3 = monitor.endTimer(timer3);
        
        assert.ok(elapsed1 >= 0);
        assert.ok(elapsed2 >= 0);
        assert.ok(elapsed3 >= 0);
    });

    test('Should handle ending non-existent timer', () => {
        const elapsed = monitor.endTimer('non-existent-timer-id');
        assert.strictEqual(elapsed, 0);
    });

    test('Should log summary without errors', () => {
        monitor.recordMetric('metric1', 100);
        monitor.recordMetric('metric1', 200);
        monitor.recordMetric('metric2', 50);
        
        // Should not throw
        assert.doesNotThrow(() => {
            monitor.logSummary();
        });
    });

    test('Should not log summary when disabled', () => {
        const disabledMonitor = new PerformanceMonitor(false);
        
        // Should not throw and should do nothing
        assert.doesNotThrow(() => {
            disabledMonitor.logSummary();
        });
    });

    test('Should track multiple different metrics', () => {
        monitor.recordMetric('tokenization', 100);
        monitor.recordMetric('caching', 50);
        monitor.recordMetric('rendering', 75);
        
        const metrics = monitor.getMetrics();
        assert.strictEqual(metrics.size, 3);
        assert.ok(metrics.has('tokenization'));
        assert.ok(metrics.has('caching'));
        assert.ok(metrics.has('rendering'));
    });

    test('Should maintain separate metric arrays', () => {
        monitor.recordMetric('metric1', 100);
        monitor.recordMetric('metric2', 200);
        monitor.recordMetric('metric1', 150);
        
        const metrics = monitor.getMetrics();
        const metric1Values = metrics.get('metric1');
        const metric2Values = metrics.get('metric2');
        
        assert.ok(metric1Values);
        assert.ok(metric2Values);
        assert.strictEqual(metric1Values.length, 2);
        assert.strictEqual(metric2Values.length, 1);
    });

    test('Should calculate correct average for metrics', () => {
        monitor.recordMetric('test', 10);
        monitor.recordMetric('test', 20);
        monitor.recordMetric('test', 30);
        
        const stats = monitor.getMetricStats('test');
        assert.ok(stats);
        assert.strictEqual(stats.avg, 20);
    });

    test('Should handle single metric value', () => {
        monitor.recordMetric('single', 100);
        
        const stats = monitor.getMetricStats('single');
        assert.ok(stats);
        assert.strictEqual(stats.min, 100);
        assert.strictEqual(stats.max, 100);
        assert.strictEqual(stats.avg, 100);
        assert.strictEqual(stats.count, 1);
    });

    test('Should track timer completion in metrics', () => {
        const timerId = monitor.startTimer('timed-operation');
        
        // Simulate work
        const start = Date.now();
        while (Date.now() - start < 5) {
            // Wait 5ms
        }
        
        monitor.endTimer(timerId);
        
        // Should have recorded metric
        const metrics = monitor.getMetrics();
        assert.ok(metrics.has('timed-operation'));
        
        const stats = monitor.getMetricStats('timed-operation');
        assert.ok(stats);
        assert.ok(stats.avg >= 0);
        assert.strictEqual(stats.count, 1);
    });

    test('Should generate unique timer IDs', () => {
        const ids = new Set();
        
        for (let i = 0; i < 100; i++) {
            const id = monitor.startTimer('test');
            ids.add(id);
            monitor.endTimer(id);
        }
        
        // All IDs should be unique
        assert.strictEqual(ids.size, 100);
    });
});
