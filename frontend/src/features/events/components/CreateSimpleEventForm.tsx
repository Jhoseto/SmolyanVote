"use client";

import { Button, ImageDropzone } from "@/shared/ui";
import { useToast } from "@/shared/hooks/useToast";
import { LOCATIONS } from "../data/locations";
import { CREATE_EVENT_PAGE_COPY } from "../data/createEventPageCopy";
import { MAX_IMAGES } from "../schema";
import { useCreateSimpleEventForm } from "../hooks/useCreateSimpleEventForm";
import {
  CreateFormField,
  CreateFormSection,
  CreateFormSubmitBar,
  DefaultCoverHint,
  createFormInputClass,
} from "./CreateFormChrome";

/** Create form for a simple (yes/no/neutral) event — JSON API parity with `createSimpleEvent.html`. */
export function CreateSimpleEventForm() {
  const toast = useToast();
  const { form, onSubmit, isPending, images, setImages } = useCreateSimpleEventForm();
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const cover = CREATE_EVENT_PAGE_COPY.simple;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <CreateFormSection
        step={1}
        title="Основни данни"
        description="Ясно заглавие и контекст помагат за осъзнато гласуване."
      >
        <CreateFormField
          label="Заглавие"
          htmlFor="se-title"
          hint={errors.title ? undefined : "Формулирайте като въпрос или предложение."}
          error={errors.title?.message}
          counter={`${watch("title").length}/100`}
        >
          <input
            id="se-title"
            type="text"
            maxLength={100}
            placeholder="Напр. Трябва ли центърът да стане пешеходна зона?"
            {...register("title")}
            className={createFormInputClass}
          />
        </CreateFormField>

        <CreateFormField
          label="Описание"
          htmlFor="se-description"
          hint={errors.description ? undefined : "Добавете факти и възможни последствия."}
          error={errors.description?.message}
          counter={`${watch("description").length}/1000`}
        >
          <textarea
            id="se-description"
            rows={5}
            maxLength={1000}
            placeholder="Опишете контекста, засегнатите групи и защо въпросът е важен сега."
            {...register("description")}
            className={createFormInputClass}
          />
        </CreateFormField>

        <CreateFormField
          label="Населено място"
          htmlFor="se-location"
          hint={errors.location ? undefined : "Къде се отнася този въпрос най-пряко."}
          error={errors.location?.message}
        >
          <select id="se-location" {...register("location")} className={createFormInputClass}>
            <option value="">Изберете населено място…</option>
            {LOCATIONS.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
        </CreateFormField>
      </CreateFormSection>

      <CreateFormSection
        step={2}
        title="Етикети за гласуване"
        description="Оставете ги по подразбиране или ги адаптирайте към темата."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CreateFormField
            label="Етикет „ЗА“"
            htmlFor="se-positive"
            error={errors.positiveLabel?.message}
          >
            <input
              id="se-positive"
              type="text"
              maxLength={80}
              placeholder="ЗА"
              {...register("positiveLabel")}
              className={createFormInputClass}
            />
          </CreateFormField>
          <CreateFormField
            label="Етикет „ПРОТИВ“"
            htmlFor="se-negative"
            error={errors.negativeLabel?.message}
          >
            <input
              id="se-negative"
              type="text"
              maxLength={80}
              placeholder="ПРОТИВ"
              {...register("negativeLabel")}
              className={createFormInputClass}
            />
          </CreateFormField>
          <CreateFormField
            label="Неутрален"
            htmlFor="se-neutral"
            error={errors.neutralLabel?.message}
          >
            <input
              id="se-neutral"
              type="text"
              maxLength={80}
              placeholder="Неутрален"
              {...register("neutralLabel")}
              className={createFormInputClass}
            />
          </CreateFormField>
        </div>
      </CreateFormSection>

      <CreateFormSection
        step={3}
        title="Снимки"
        description="По избор — до 3 снимки, всяка до 8MB."
      >
        <ImageDropzone
          files={images}
          onChange={setImages}
          maxFiles={MAX_IMAGES}
          onError={(message) => toast.error(message)}
        />
        {images.length === 0 ? (
          <DefaultCoverHint imageSrc={cover.defaultCoverSrc} imageAlt={cover.defaultCoverAlt} />
        ) : null}
      </CreateFormSection>

      <CreateFormSubmitBar>
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? "Създаване..." : "Създай събитие"}
        </Button>
      </CreateFormSubmitBar>
    </form>
  );
}
