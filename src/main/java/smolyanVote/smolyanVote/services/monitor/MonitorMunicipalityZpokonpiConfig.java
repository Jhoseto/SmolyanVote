package smolyanVote.smolyanVote.services.monitor;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Curated public ZPKONPI / roster URLs per municipality in oblast Smolyan.
 * Sources are official municipal sites (verified 2026-07).
 */
public final class MonitorMunicipalityZpokonpiConfig {

    public record Source(
            String authorityEik,
            List<String> registerUrls,
            List<String> rosterUrls,
            String publicRegisterLink,
            boolean requiresScraper) {
    }

    private static final Map<String, Source> BY_EIK = Map.ofEntries(
            Map.entry(
                    MonitorRegionalConfig.SMOLYAN_CITY_EIK,
                    new Source(
                            MonitorRegionalConfig.SMOLYAN_CITY_EIK,
                            List.of(
                                    "https://www.smolyan.bg/bg/menu/fl/82",
                                    "https://www.smolyan.bg/bg/menu/sl/114"),
                            List.of(),
                            "https://www.smolyan.bg/bg/menu/fl/82",
                            true)),
            Map.entry(
                    MonitorRegionalConfig.ZLATOGRAD_EIK,
                    new Source(
                            MonitorRegionalConfig.ZLATOGRAD_EIK,
                            List.of(
                                    "https://www.zlatograd.bg/obshtinski-savet/deklaratsii-po-zpkonpi-obs/deklaratsii-za-nesavmestimost",
                                    "https://www.zlatograd.bg/obshtinski-savet/deklaratsii-po-zpkonpi-obs/deklaratsii-za-ustanovyavane-i-predotvratyavane-na-konflikt-na-interesi",
                                    "https://www.zlatograd.bg/administraciya/deklaratsii-no-ZPKONPI"),
                            List.of("https://www.zlatograd.bg/obshtinski-savet/obshtinski-savetnitsi"),
                            "https://www.zlatograd.bg/obshtinski-savet/deklaratsii-po-zpkonpi-obs",
                            false)),
            Map.entry(
                    MonitorRegionalConfig.MADAN_EIK,
                    new Source(
                            MonitorRegionalConfig.MADAN_EIK,
                            List.of(
                                    "https://www.obs.madan.bg/documenti/declaracii/deklaracii-cl-35-zpkonpi/458-ch-35-formulyari.html"),
                            List.of("https://www.obs.madan.bg/stuktura/obshtinski-savetnici.html"),
                            "https://www.obs.madan.bg/documenti/declaracii/deklaracii-cl-35-zpkonpi.html",
                            false)),
            Map.entry(
                    MonitorRegionalConfig.NEDELINO_EIK,
                    new Source(
                            MonitorRegionalConfig.NEDELINO_EIK,
                            List.of(
                                    "https://nedelino.bg/oba-deklaratsii-zpkonpi-2024-13062025/",
                                    "https://nedelino.bg/oba-nedelino-deklaratsii-zpkonpi-2023/"),
                            List.of("https://nedelino.bg/person-category/obs-nedelino/"),
                            "https://nedelino.bg/obst-adm-dekl-zpkonpi-chl-35-al-1/",
                            false)),
            Map.entry(
                    MonitorRegionalConfig.DEVIN_EIK,
                    new Source(
                            MonitorRegionalConfig.DEVIN_EIK,
                            List.of(),
                            List.of("https://devin.bg/index.php?option=com_content&view=article&id=8561"),
                            "https://devin.bg/index.php?option=com_content&view=section&id=12",
                            false)),
            Map.entry(
                    MonitorRegionalConfig.RUDOZEM_EIK,
                    new Source(
                            MonitorRegionalConfig.RUDOZEM_EIK,
                            List.of(),
                            List.of("https://rudozem.bg/subsection-104-systav_na_obschinski_sy.html"),
                            "https://rudozem.bg",
                            false)),
            Map.entry(
                    MonitorRegionalConfig.CHEPELARE_EIK,
                    new Source(
                            MonitorRegionalConfig.CHEPELARE_EIK,
                            List.of(),
                            List.of("https://chepelare.bg"),
                            "https://chepelare.bg",
                            false)),
            Map.entry(
                    MonitorRegionalConfig.BANITE_EIK,
                    new Source(
                            MonitorRegionalConfig.BANITE_EIK,
                            List.of(
                                    "https://banite.egov.bg/wps/portal/banite/administration/declarations-ZPKONPI"),
                            List.of(
                                    "https://banite.egov.bg/wps/portal/banite/municipal-council/permanent.commissions"),
                            "https://banite.egov.bg/wps/portal/banite/administration/declarations-ZPKONPI",
                            true)));

    private MonitorMunicipalityZpokonpiConfig() {
    }

    public static Optional<Source> forEik(String eik) {
        if (eik == null || eik.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(BY_EIK.get(eik.trim()));
    }
}
