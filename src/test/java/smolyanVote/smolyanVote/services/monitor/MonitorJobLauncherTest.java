package smolyanVote.smolyanVote.services.monitor;

import org.junit.jupiter.api.Test;
import smolyanVote.smolyanVote.services.monitor.MonitorJobLauncher.JobResult;
import smolyanVote.smolyanVote.services.monitor.MonitorJobLauncher.JobStatus;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

class MonitorJobLauncherTest {

    @Test
    void reportsSuccessMessageAfterTheJobFinishes() throws Exception {
        MonitorJobLauncher launcher = new MonitorJobLauncher();

        launcher.launch("SIGMA", "SIGMA импорт", () -> JobResult.ok("SIGMA: 12 договора"));

        awaitSettled(launcher, "SIGMA");
        MonitorJobLauncher.JobState state = stateOf(launcher, "SIGMA");
        assertThat(state.status()).isEqualTo(JobStatus.SUCCESS);
        assertThat(state.message()).isEqualTo("SIGMA: 12 договора");
        assertThat(state.finishedAt()).isNotNull();
    }

    @Test
    void aThrownExceptionBecomesAFailedJobWithItsRootCause() throws Exception {
        MonitorJobLauncher launcher = new MonitorJobLauncher();

        launcher.launch("EOP", "EOP импорт", () -> {
            throw new IllegalStateException("bucket недостъпен");
        });

        awaitSettled(launcher, "EOP");
        MonitorJobLauncher.JobState state = stateOf(launcher, "EOP");
        assertThat(state.status()).isEqualTo(JobStatus.FAILED);
        assertThat(state.message()).contains("bucket недостъпен");
    }

    @Test
    void aSourceThatAnsweredWithErrorsIsNotReportedAsSuccess() throws Exception {
        MonitorJobLauncher launcher = new MonitorJobLauncher();

        launcher.launch("EOP", "EOP импорт", () -> JobResult.failed("EOP: 0 договора | Грешки: 403"));

        awaitSettled(launcher, "EOP");
        assertThat(stateOf(launcher, "EOP").status()).isEqualTo(JobStatus.FAILED);
    }

    @Test
    void refusesToStartTheSameJobTwiceWhileItIsStillRunning() throws Exception {
        MonitorJobLauncher launcher = new MonitorJobLauncher();
        CountDownLatch release = new CountDownLatch(1);

        launcher.launch("SIGMA", "SIGMA импорт", () -> {
            release.await(5, TimeUnit.SECONDS);
            return JobResult.ok("готово");
        });

        MonitorJobLauncher.JobState second = launcher.launch("SIGMA", "SIGMA импорт",
                () -> JobResult.ok("не трябва да се изпълни"));
        assertThat(second.status()).isEqualTo(JobStatus.BUSY);
        assertThat(launcher.isPending("SIGMA")).isTrue();

        release.countDown();
        awaitSettled(launcher, "SIGMA");
        assertThat(stateOf(launcher, "SIGMA").message()).isEqualTo("готово");
    }

    @Test
    void jobsWaitForEachOtherInsteadOfCompetingForTheDatabase() throws Exception {
        MonitorJobLauncher launcher = new MonitorJobLauncher();
        CountDownLatch release = new CountDownLatch(1);

        launcher.launch("SIGMA", "SIGMA импорт", () -> {
            release.await(5, TimeUnit.SECONDS);
            return JobResult.ok("първа");
        });
        MonitorJobLauncher.JobState queued = launcher.launch("EOP", "EOP импорт",
                () -> JobResult.ok("втора"));

        assertThat(queued.status()).isEqualTo(JobStatus.QUEUED);

        release.countDown();
        awaitSettled(launcher, "EOP");
        assertThat(stateOf(launcher, "EOP").status()).isEqualTo(JobStatus.SUCCESS);
    }

    private static MonitorJobLauncher.JobState stateOf(MonitorJobLauncher launcher, String key) {
        return launcher.snapshot().stream()
                .filter(state -> state.key().equals(key))
                .findFirst()
                .orElseThrow(() -> new AssertionError("no state for " + key));
    }

    private static void awaitSettled(MonitorJobLauncher launcher, String key) throws InterruptedException {
        long deadline = System.currentTimeMillis() + 5_000;
        while (launcher.isPending(key) && System.currentTimeMillis() < deadline) {
            Thread.sleep(20);
        }
        assertThat(launcher.isPending(key)).isFalse();
    }
}
