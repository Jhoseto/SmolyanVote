package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/** POST /api/v1/publications/upload-image — ack with the resulting Cloudinary URL. */
public record ImageUploadResponse(boolean success, String url, String message) {

    public static ImageUploadResponse ok(String url) {
        return new ImageUploadResponse(true, url, "Снимката е качена успешно.");
    }
}
