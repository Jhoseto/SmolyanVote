package solyanVote.solyanVote;

import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;

import java.util.List;
import java.util.concurrent.*;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;

@Execution(ExecutionMode.CONCURRENT)
public class LoadAndConcurrencyPublicTest {

    private static final int NUMBER_OF_REQUESTS = 1000; // броя на заявките
    private static final String BASE_URL = "http://192.168.1.3:2662/mainEvents";
    private static final String AUTH_TOKEN = "YOUR_ACCESS_TOKEN"; //  токен

    @Test
    void testConcurrentMainEventsAccess() throws InterruptedException {
        // FixedThreadPool с 50 нишки, за натоварването
        ExecutorService executorService = Executors.newFixedThreadPool(50); //  броя на нишките

        // 1000 заявки с различни входни данни
        List<Callable<Response>> callables = IntStream.range(0, NUMBER_OF_REQUESTS)
                .mapToObj(i -> (Callable<Response>) () -> {
                    Response response = RestAssured
                            .given()
                            .header("Authorization", "Bearer " + AUTH_TOKEN) // Bearer токен за автентикация
                            .contentType("application/json")
                            .get(BASE_URL)
                            .andReturn();

                    //  обработка на неуспешни заявки
                    if (response.getStatusCode() != 200) {
                        System.err.println("Request " + i + " failed with status: " + response.getStatusCode());
                        System.err.println("Response: " + response.getBody().asString());
                    }
                    return response;
                })
                .toList();

        //  всички заявки паралелно
        List<Future<Response>> futures = executorService.invokeAll(callables);
        executorService.shutdown();
        executorService.awaitTermination(2, TimeUnit.MINUTES); //  времето за изчакване за по-голямо натоварване

        //  успешните заявки
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
        assertEquals(NUMBER_OF_REQUESTS, successCount, // Проверка дали всички заявки са успешни
                "Not all requests returned HTTP 200. Successful: " + successCount);

        // Проверка на какви други статут кодове сме попаднали
        long failedCount = futures.stream()
                .filter(future -> {
                    try {
                        return future.get().getStatusCode() != 200;
                    } catch (InterruptedException | ExecutionException e) {
                        System.err.println("Error in future: " + e.getMessage());
                        return true;
                    }
                })
                .count();

        System.out.println("Number of failed responses: " + failedCount);
    }
}
