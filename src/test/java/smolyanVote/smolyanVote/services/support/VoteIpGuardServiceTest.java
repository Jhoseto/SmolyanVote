package smolyanVote.smolyanVote.services.support;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import smolyanVote.smolyanVote.models.VoteIpEntity;
import smolyanVote.smolyanVote.repositories.VoteIpRepository;
import smolyanVote.smolyanVote.utils.ClientIpResolver;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoteIpGuardServiceTest {

    private static final String IP = "198.51.100.10";
    private static final Long EVENT_ID = 42L;
    private static final String EVENT_TYPE = "SIMPLE_EVENT";

    @Mock
    private VoteIpRepository voteIpRepository;

    private ClientIpResolver clientIpResolver;
    private VoteIpGuardService guardService;

    @BeforeEach
    void setUp() {
        clientIpResolver = new ClientIpResolver();
    }

    private void createGuard(boolean allowMissingIp) {
        guardService = new VoteIpGuardService(voteIpRepository, clientIpResolver, allowMissingIp);
    }

    @Test
    void reserveIpSlot_rejectsMissingIpWhenFailClosed() {
        createGuard(false);

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> guardService.reserveIpSlot(null, EVENT_ID, EVENT_TYPE, 1L));

        assertTrue(ex.getMessage().contains("IP"));
        verifyNoInteractions(voteIpRepository);
    }

    @Test
    void reserveIpSlot_skipsCheckWhenMissingIpAllowed() {
        createGuard(true);

        assertDoesNotThrow(() -> guardService.reserveIpSlot(null, EVENT_ID, EVENT_TYPE, 1L));
        verifyNoInteractions(voteIpRepository);
    }

    @Test
    void reserveIpSlot_rejectsWhenLimitReached() {
        createGuard(false);
        List<VoteIpEntity> existing = List.of(
                row(IP, 1L), row(IP, 2L), row(IP, 3L));
        when(voteIpRepository.lockByIpAddressAndEventIdAndEventType(IP, EVENT_ID, EVENT_TYPE))
                .thenReturn(existing);

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> guardService.reserveIpSlot(IP, EVENT_ID, EVENT_TYPE, 4L));

        assertTrue(ex.getMessage().contains("3"));
        verify(voteIpRepository, never()).save(any());
    }

    @Test
    void reserveIpSlot_insertsReservationWhenUnderLimit() {
        createGuard(false);
        when(voteIpRepository.lockByIpAddressAndEventIdAndEventType(IP, EVENT_ID, EVENT_TYPE))
                .thenReturn(new ArrayList<>());
        when(voteIpRepository.countByIpAddressAndEventIdAndEventType(IP, EVENT_ID, EVENT_TYPE))
                .thenReturn(1L);

        guardService.reserveIpSlot(IP, EVENT_ID, EVENT_TYPE, 7L);

        ArgumentCaptor<VoteIpEntity> captor = ArgumentCaptor.forClass(VoteIpEntity.class);
        verify(voteIpRepository).save(captor.capture());
        VoteIpEntity saved = captor.getValue();
        assertEquals(IP, saved.getIpAddress());
        assertEquals(EVENT_ID, saved.getEventId());
        assertEquals(EVENT_TYPE, saved.getEventType());
        assertEquals(7L, saved.getUserId());
    }

    @Test
    void reserveIpSlot_skipsDuplicateReservationForSameUser() {
        createGuard(false);
        List<VoteIpEntity> existing = new ArrayList<>(List.of(row(IP, 5L)));
        when(voteIpRepository.lockByIpAddressAndEventIdAndEventType(IP, EVENT_ID, EVENT_TYPE))
                .thenReturn(existing);

        guardService.reserveIpSlot(IP, EVENT_ID, EVENT_TYPE, 5L);

        verify(voteIpRepository, never()).save(any());
    }

    @Test
    void reserveIpSlot_rejectsWhenCountExceedsLimitAfterInsert() {
        createGuard(false);
        when(voteIpRepository.lockByIpAddressAndEventIdAndEventType(IP, EVENT_ID, EVENT_TYPE))
                .thenReturn(new ArrayList<>(List.of(row(IP, 1L), row(IP, 2L))));
        when(voteIpRepository.countByIpAddressAndEventIdAndEventType(IP, EVENT_ID, EVENT_TYPE))
                .thenReturn(4L);

        assertThrows(
                IllegalStateException.class,
                () -> guardService.reserveIpSlot(IP, EVENT_ID, EVENT_TYPE, 3L));
    }

    private static VoteIpEntity row(String ip, Long userId) {
        return new VoteIpEntity(ip, EVENT_ID, EVENT_TYPE, userId);
    }
}
