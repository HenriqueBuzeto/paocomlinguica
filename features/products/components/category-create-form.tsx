"use client";

import { useActionState } from "react";

import { createCategoryAction } from "@/app/produtos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CategoryCreateForm() {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try {
        await createCategoryAction(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Erro ao criar categoria.";
      }
    },
    null,
  );

  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" placeholder="Ex: Lanches" required />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Salvando..." : "Adicionar categoria"}
      </Button>
    </form>
  );
}
