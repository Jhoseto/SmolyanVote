package smolyanVote.smolyanVote.utils;

/**
 * Point-in-polygon check for the Smolyan region — mirrors frontend {@code geo.ts} /
 * legacy {@code map-core.js}. Coordinates are WGS84 decimal degrees.
 */
public final class SmolyanRegionValidator {

    private static final double MIN_LAT = 41.336;
    private static final double MAX_LAT = 41.926;
    private static final double MIN_LNG = 24.318;
    private static final double MAX_LNG = 25.168;

    /** Polygon ring as {@code [lat, lng]} — same vertices as frontend {@code SMOLYAN_POLYGON_LAT_LNG}. */
    private static final double[][] POLYGON = {
            {41.795888098191426, 24.318237304687504},
            {41.828642001860544, 24.337463378906254},
            {41.85728792769137, 24.367675781250004},
            {41.86956082699455, 24.406127929687504},
            {41.89205502378826, 24.42672729492188},
            {41.92578147109541, 24.444580078125004},
            {41.917606998887024, 24.510498046875},
            {41.880808915193874, 24.559936523437504},
            {41.91249742196845, 24.66018676757813},
            {41.881831370505594, 24.765930175781254},
            {41.73340458018376, 24.78927612304688},
            {41.70880422215806, 24.87167358398438},
            {41.62673502076991, 24.919738769531254},
            {41.58360681482734, 25.01312255859375},
            {41.49726393195056, 25.05294799804688},
            {41.498292501398545, 25.16830444335938},
            {41.3737170273134, 25.15457153320313},
            {41.33660710626426, 25.106506347656254},
            {41.40668586105652, 24.916992187500004},
            {41.395354710280166, 24.827728271484375},
            {41.34691753986531, 24.80850219726563},
            {41.41904486310779, 24.71649169921875},
            {41.42625319507272, 24.614868164062504},
            {41.56819689811343, 24.524230957031254},
            {41.52708581365465, 24.44869995117188},
            {41.52502957323801, 24.36904907226563},
            {41.64110468287587, 24.34982299804688},
            {41.68111756290652, 24.342956542968754},
            {41.7200805552871, 24.34158325195313},
            {41.7559466348148, 24.32235717773438},
    };

    private SmolyanRegionValidator() {
    }

    public static boolean isWithinSmolyanRegion(double lat, double lng) {
        if (lat < MIN_LAT || lat > MAX_LAT || lng < MIN_LNG || lng > MAX_LNG) {
            return false;
        }
        return isPointInPolygon(lat, lng, POLYGON);
    }

    private static boolean isPointInPolygon(double lat, double lng, double[][] polygon) {
        boolean inside = false;
        for (int i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            double lati = polygon[i][0];
            double lngi = polygon[i][1];
            double latj = polygon[j][0];
            double lngj = polygon[j][1];
            boolean intersect = (lngi > lng) != (lngj > lng)
                    && lat < ((latj - lati) * (lng - lngi)) / (lngj - lngi) + lati;
            if (intersect) {
                inside = !inside;
            }
        }
        return inside;
    }
}
