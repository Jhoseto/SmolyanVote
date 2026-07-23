"use client";

import { Button, ImageDropzone } from "@/shared/ui";
import { useToast } from "@/shared/hooks/useToast";
import { LOCATIONS } from "../data/locations";
import { CREATE_EVENT_PAGE_COPY } from "../data/createEventPageCopy";
import { MAX_IMAGES } from "../schema";
import { useCreateReferendumForm } from "../hooks/useCreateReferendumForm";
import { OptionsListEditor } from "./OptionsListEditor";
import {
  CreateFormField,
  CreateFormSection,
  CreateFormSubmitBar,
  DefaultCoverHint,
  createFormInputClass,
} from "./CreateFormChrome";

/** Create form for a referendum (multi-option, single choice) — JSON API parity with `createReferendum.html`. */
export function CreateReferendumForm() {
  const toast = useToast();
  const { form, onSubmit, isPending, images, setImages } = useCreateReferendumForm();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const cover = CREATE_EVENT_PAGE_COPY.referendum;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <CreateFormSection
        step={1}
        title="Основни данни"
        description="Конкретна тема и сравними опции."
      >
        <CreateFormField
          label="Тема"
          htmlFor="ref-topic"
          hint={errors.topic ? undefined : "Един ясен обществен въпрос без двусмислие."}
          error={errors.topic?.message}
          counter={`${watch("topic").length}/150`}
        >
          <input
            id="ref-topic"
            type="text"
            maxLength={150}
            placeholder="Напр. Как да се разпредели бюджетът за благоустройство?"
            {...register("topic")}
            className={createFormInputClass}
          />
        </CreateFormField>

        <CreateFormField
          label="Описание"
          htmlFor="ref-description"
          hint={errors.description ? undefined : "Включете ключови аргументи, без да налагате избор."}
          error={errors.description?.message}
          counter={`${watch("description").length}/1000`}
        >
          <textarea
            id="ref-description"
            rows={5}
            maxLength={1000}
            placeholder="Представете контекста, алтернативите и защо общността трябва да се произнесе."
            {...register("description")}
            className={createFormInputClass}
          />
        </CreateFormField>

        <CreateFormField
          label="Населено място"
          htmlFor="ref-location"
          hint={errors.location ? undefined : "Къде се отнася този референдум."}
          error={errors.location?.message}
        >
          <select id="ref-location" {...register("location")} className={createFormInputClass}>
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
        description="2–10 опции. Всеки избира точно една."
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
          {isPending ? "Създаване..." : "Създай референдум"}
        </Button>
      </CreateFormSubmitBar>
    </form>
  );
}
