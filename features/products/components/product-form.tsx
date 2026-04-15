"use client";

import { useActionState } from "react";

import { createProductAction, updateProductAction } from "@/app/produtos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CategoryOption = { id: string; name: string; active: boolean };

type ProductInitial = {
  id?: string;
  name?: string;
  price?: string;
  cost?: string;
  categoryId?: string | null;
  active?: boolean;
};

export function ProductForm({
  categories,
  initial,
  mode,
}: {
  categories: CategoryOption[];
  initial?: ProductInitial;
  mode: "create" | "edit";
}) {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try {
        if (mode === "edit") {
          await updateProductAction(formData);
        } else {
          await createProductAction(formData);
        }
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Erro ao salvar produto.";
      }
    },
    null,
  );

  return (
    <form action={action} className="grid gap-4">
      {mode === "edit" ? (
        <input type="hidden" name="id" value={initial?.id ?? ""} />
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          placeholder="Ex: Pão com linguiça"
          defaultValue={initial?.name ?? ""}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            placeholder="Ex: 18,00"
            defaultValue={initial?.price ?? ""}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="cost">Custo (opcional)</Label>
          <Input
            id="cost"
            name="cost"
            inputMode="decimal"
            placeholder="Ex: 8,00"
            defaultValue={initial?.cost ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="categoryId">Categoria</Label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={initial?.categoryId ?? ""}
          className="h-10 w-full rounded-xl border border-input bg-background/60 px-3 text-sm shadow-sm shadow-black/5 outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
        >
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id} disabled={!c.active}>
              {c.name}{c.active ? "" : " (inativa)"}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 rounded-2xl border bg-background/60 px-4 py-3 text-sm shadow-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={initial?.active ?? true}
          className="size-4 rounded border-input"
        />
        <span className="font-medium">Produto ativo</span>
        <span className="ml-auto text-xs text-muted-foreground">
          Produtos inativos não aparecem no PDV
        </span>
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Salvando..." : mode === "edit" ? "Salvar alterações" : "Cadastrar produto"}
      </Button>
    </form>
  );
}
