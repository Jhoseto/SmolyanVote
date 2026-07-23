"use client";

import { Button, ImageDropzone } from "@/shared/ui";
import { useToast } from "@/shared/hooks/useToast";
import { LOCATIONS } from "../data/locations";
import { CREATE_EVENT_PAGE_COPY } from "../data/createEventPageCopy";
import { MAX_IMAGES } from "../schema";
import { useCreateMultiPollForm } from "../hooks/useCreateMultiPollForm";
import { OptionsListEditor } from "./OptionsListEditor";
import {
  CreateFormField,
  CreateFormSection,
  CreateFormSubmitBar,
  DefaultCoverHint,
  createFormInputClass,
} from "./CreateFormChrome";

/** Create form for a multi-poll (multi-option) — JSON API parity with `createMultiPoll.html`. */
export function CreateMultiPollForm() {
  const toast = useToast();
  const { form, onSubmit, isPending, images, setImages } = useCreateMultiPollForm();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const cover = CREATE_EVENT_PAGE_COPY.multipoll;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <CreateFormSection
        step={1}
        title="Основни данни"
        description="Нюансирани предпочитания — до 3 избора на човек."
      >
        <CreateFormField
          label="Заглавие"
          htmlFor="mp-title"
          hint={errors.title ? undefined : "Посочете, че са позволени няколко избора."}
          error={errors.title?.message}
          counter={`${watch("title").length}/150`}
        >
          <input
            id="mp-title"
            type="text"
            maxLength={150}
            placeholder="Напр. Кои три приоритета са най-важни за парковете?"
            {...register("title")}
            className={createFormInputClass}
          />
        </CreateFormField>

        <CreateFormField
          label="Описание"
          htmlFor="mp-description"
          hint={errors.description ? undefined : "Кратки, сравними опции дават по-ясен резултат."}
          error={errors.description?.message}
          counter={`${watch("description").length}/1000`}
        >
          <textarea
            id="mp-description"
            rows={5}
            maxLength={1000}
            placeholder="Обяснете критериите и защо искате комбинирани предпочитания."
            {...register("description")}
            className={createFormInputClass}
          />
        </CreateFormField>

        <CreateFormField
          label="Населено място"
          htmlFor="mp-location"
          hint={errors.location ? undefined : "Къде се отнася тази анкета."}
          error={errors.location?.message}
        >
          <select id="mp-location" {...register("location")} className={createFormInputClass}>
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
        title="Опции за гласуване"
        description="2–10 опции. Всеки може да избере до 3."
      >
        <OptionsListEditor
          options={watch("options")}
          onChange={(next) => setValue("options", next, { shouldValidate: true })}
          error={errors.options?.message}
        />
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
          {isPending ? "Създаване..." : "Създай анкета"}
        </Button>
      </CreateFormSubmitBar>
    </form>
  );
}
