package solyanVote.solyanVote;

import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.assertEquals;

@Execution(ExecutionMode.CONCURRENT)
public class StressTestForEventService {

    private static final int NUMBER_OF_REQUESTS = 100;  // Брой на паралелни заявки
    private static final String BASE_URL = "http://localhost:2662"; // Променете с реалния URL
    private static final String AUTH_TOKEN = "YOUR_ACCESS_TOKEN";  // Токен за автентикация

    // Стрес тест за пагиниране на събития
    @Test
    void testGetPaginatedEvents() throws InterruptedException {
        ExecutorService executorService = Executors.newFixedThreadPool(20);

        List<Callable<Response>> callables = new ArrayList<>();
        for (int i = 0; i < NUMBER_OF_REQUESTS; i++) {
            int page = i / 10; // Примерна логика за избиране на различна страница
            int size = 10; // Размер на страницата
            callables.add(() -> {
                return RestAssured
                        .given()
                        .header("Authorization", "Bearer " + AUTH_TOKEN)
                        .param("page", page)
                        .param("size", size)
                        .get(BASE_URL + "/mainEvents")
                        .andReturn();
            });
        }

        List<Future<Response>> futures = executorService.invokeAll(callables);
        executorService.shutdown();
        executorService.awaitTermination(1, TimeUnit.MINUTES);

        long successCount = futures.stream()
                .filter(future -> {
                    try {
                        return future.get().getStatusCode() == 200;
                    } catch (InterruptedException | ExecutionException e) {
                        System.err.println("Error in future: " + e.getMessage());
                        return false;
                    }
                })
                .count();

        System.out.println("Number of successful responses: " + successCount);
        assertEquals(NUMBER_OF_REQUESTS, successCount,
                "Not all requests returned HTTP 200. Successful: " + successCount);
    }

    // Стрес тест за извличане на всички събития
    @Test
    void testGetAllEvents() throws InterruptedException {
        ExecutorService executorService = Executors.newFixedThreadPool(20);

        List<Callable<Response>> callables = new ArrayList<>();
        for (int i = 0; i < NUMBER_OF_REQUESTS; i++) {
            callables.add(() -> {
                return RestAssured
                        .given()
                        .header("Authorization", "Bearer " + AUTH_TOKEN)
                        .get(BASE_URL + "/allEvents")
                        .andReturn();
            });
        }

        List<Future<Response>> futures = executorService.invokeAll(callables);
        executorService.shutdown();
        executorService.awaitTermination(1, TimeUnit.MINUTES);

        long successCount = futures.stream()
                .filter(future -> {
                    try {
                        return future.get().getStatusCode() == 200;
                    } catch (InterruptedException | ExecutionException e) {
                        System.err.println("Error in future: " + e.getMessage());
                        return false;
                    }
                })
                .count();

        System.out.println("Number of successful responses: " + successCount);
        assertEquals(NUMBER_OF_REQUESTS, successCount,
                "Not all requests returned HTTP 200. Successful: " + successCount);
    }

    // Стрес тест за извличане на събитие по ID
    @Test
    void testGetEventById() throws InterruptedException {
        ExecutorService executorService = Executors.newFixedThreadPool(20);

        List<Callable<Response>> callables = new ArrayList<>();
        for (int i = 0; i < NUMBER_OF_REQUESTS; i++) {
            Long eventId = (long) (i % 10); // Примерен начин за генериране на ID-та
            callables.add(() -> {
                return RestAssured
                        .given()
                        .header("Authorization", "Bearer " + AUTH_TOKEN)
                        .get(BASE_URL + "/event/" + eventId)
                        .andReturn();
            });
        }

        List<Future<Response>> futures = executorService.invokeAll(callables);
        executorService.shutdown();
        executorService.awaitTermination(1, TimeUnit.MINUTES);

        long successCount = futures.stream()
                .filter(future -> {
                    try {
                        return future.get().getStatusCode() == 200;
                    } catch (InterruptedException | ExecutionException e) {
                        System.err.println("Error in future: " + e.getMessage());
                        return false;
                    }
                })
                .count();

        System.out.println("Number of successful responses: " + successCount);
        assertEquals(NUMBER_OF_REQUESTS, successCount,
                "Not all requests returned HTTP 200. Successful: " + successCount);
    }
}
