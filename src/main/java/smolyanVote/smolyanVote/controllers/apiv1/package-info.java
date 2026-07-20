/**
 * Primary JSON API for the Next.js frontend ({@code /api/v1/**}).
 *
 * <p>Naming: classes are plain domain controllers ({@code AuthController},
 * {@code EventsController}, …). The {@code apiv1} package (and
 * {@code @RequestMapping("/api/v1/...")}) carries the version — do not prefix
 * class names with {@code ApiV1}.
 *
 * <p>Legacy HTML/hybrid controllers that still exist temporarily live outside
 * this package as {@code Legacy*} (e.g. {@code LegacyPublicationsController}).
 */
package smolyanVote.smolyanVote.controllers.apiv1;
