package smolyanVote.smolyanVote.viewsAndDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.enums.Locations;

public class CreateEventView {

    @NotBlank
    @Size(max = 100)
    private String title;

    @NotBlank
    @Size(max = 1000)
    private String description;

    private Locations location;
    private String creatorName;
    private String creatorImage;
    private MultipartFile image1;
    private MultipartFile image2;
    private MultipartFile image3;
    private String positiveLabel;
    private String negativeLabel;
    private String neutralLabel;


    // Getters and Setters
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Locations getLocation() {return location;}

    public void setLocation(Locations location) {this.location = location;}

    public String getCreatorName() {
        return creatorName;
    }

    public void setCreatorName(String creatorName) {
        this.creatorName = creatorName;
    }

    public String getCreatorImage() {
        return creatorImage;
    }

    public void setCreatorImage(String creatorImage) {
        this.creatorImage = creatorImage;
    }

    public MultipartFile getImage1() {
        return image1;
    }

    public void setImage1(MultipartFile image1) {
        this.image1 = image1;
    }

    public MultipartFile getImage2() {
        return image2;
    }

    public void setImage2(MultipartFile image2) {
        this.image2 = image2;
    }

    public MultipartFile getImage3() {
        return image3;
    }

    public void setImage3(MultipartFile image3) {
        this.image3 = image3;
    }

    public String getPositiveLabel() {return positiveLabel;}

    public void setPositiveLabel(String positiveLabel) {this.positiveLabel = positiveLabel;}

    public String getNegativeLabel() {return negativeLabel;}

    public void setNegativeLabel(String negativeLabel) {this.negativeLabel = negativeLabel;}

    public String getNeutralLabel() {return neutralLabel;}

    public void setNeutralLabel(String neutralLabel) {this.neutralLabel = neutralLabel;}
}
