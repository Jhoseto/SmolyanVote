package smolyanVote.smolyanVote.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Асинхронна конфигурация за Activity Logging система
 * Настройва thread pools за @Async операции
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Thread pool специално за activity logging
     * Отделен pool за да не блокира други операции
     */
    @Bean(name = "activityLogExecutor")
    public Executor activityLogExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        // Core pool размер - основни threads които винаги са живи
        executor.setCorePoolSize(2);

        // Максимален pool размер при високо натоварване
        executor.setMaxPoolSize(10);

        // Queue capacity - чакащи задачи преди да се създадат нови threads
        executor.setQueueCapacity(100);

        // Prefix за thread имената (за debugging)
        executor.setThreadNamePrefix("ActivityLog-");

        // Keep alive time за idle threads
        executor.setKeepAliveSeconds(60);

        // Reject policy при пълен pool - CallerRunsPolicy означава че
        // при пълен pool, задачата ще се изпълни от calling thread
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());

        // Graceful shutdown - чака текущите задачи да завършат
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);

        executor.initialize();
        return executor;
    }

    /**
     * Thread pool за WebSocket broadcasting
     * Отделен pool за real-time съобщения
     */
    @Bean(name = "webSocketExecutor")
    public Executor webSocketExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        // По-малък pool за WebSocket операции
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("WebSocket-");
        executor.setKeepAliveSeconds(30);

        // За WebSocket съобщения е важно да не блокираме
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.DiscardOldestPolicy());

        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);

        executor.initialize();
        return executor;
    }

    /**
     * Default async executor за други операции
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(15);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("Async-");
        executor.setKeepAliveSeconds(120);

        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());

        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);

        executor.initialize();
        return executor;
    }
}