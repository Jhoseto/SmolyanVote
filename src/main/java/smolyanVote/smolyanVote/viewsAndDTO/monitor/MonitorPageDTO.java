package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.util.List;

public record MonitorPageDTO<T>(
        List<T> items,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    public static <T> MonitorPageDTO<T> of(List<T> items, int page, int size, long total) {
        int totalPages = size <= 0 ? 0 : (int) Math.ceil((double) total / size);
        return new MonitorPageDTO<>(items, page, size, total, totalPages);
    }
}
