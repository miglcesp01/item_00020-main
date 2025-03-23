"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { type Item, CATEGORIES } from "@/lib/types"

// Base schema without unique name validation - matching the original Item type exactly
export const baseItemSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(20, { message: "Name cannot exceed 20 characters" }),
  description: z.string(),
  category: z.string().min(1, { message: "Please select a category" }),
  quantity: z.coerce
    .number()
    .int()
    .refine((val) => val > 0, { message: "Quantity must be greater than 0" }),
  price: z.coerce.number().refine((val) => val > 0, { message: "Price must be greater than 0" }),
  supplier: z.string(),
  lastUpdated: z.string(), // Make lastUpdated required to match Item type
})

// Type derived from the schema
export type InventoryItem = z.infer<typeof baseItemSchema>

// Function to create item schema with name uniqueness validation
export const createItemSchema = (existingItems: Item[], currentItem?: Item | null) => {
  return baseItemSchema.extend({
    name: baseItemSchema.shape.name.refine(
      (name) => {
        if (currentItem && name.toLowerCase() === currentItem.name.toLowerCase()) {
          return true
        }
        return !existingItems.some((i) => i.name.toLowerCase() === name.toLowerCase())
      },
      { message: "An item with this name already exists" },
    ),
  })
}

const defaultValues: Item = {
  id: "",
  name: "",
  description: "",
  category: "",
  quantity: 0,
  price: 0,
  supplier: "",
  lastUpdated: new Date().toISOString(), // Ensure we have a valid lastUpdated timestamp
}

interface ItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (item: Item) => void
  existingItems: Item[]
  item?: Item | null
  mode: "add" | "edit"
}

export function ItemDialog({ open, onOpenChange, onSave, existingItems, item, mode }: ItemDialogProps) {
  const isEditing = mode === "edit"
  
  const itemSchema = createItemSchema(existingItems, isEditing ? item : null)
  type ItemFormValues = z.infer<typeof itemSchema>

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues:
      isEditing && item
        ? {
            ...item,
            quantity: Number(item.quantity),
            price: Number(item.price),
          }
        : defaultValues,
    mode: "onSubmit",
  })

  useEffect(() => {
    if (open) {
      if (isEditing && item) {
        form.reset({
          ...item,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })
      } else {
        form.reset(defaultValues)
      }
    }
  }, [open, item, isEditing, form])

  const onSubmit = (values: ItemFormValues) => {
    const timestamp = new Date().toISOString();
    
    // Ensure we have a valid id and all required fields
    const itemToSave: Item = {
      ...values,
      id: isEditing && item ? item.id : values.id || generateId(),
      description: values.description || "",
      supplier: values.supplier || "",
      lastUpdated: isEditing ? timestamp : values.lastUpdated || timestamp,
    }
    onSave(itemToSave)
    onOpenChange(false)
  }

  // Function to generate a simple ID if needed
  const generateId = (): string => {
    return `item_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[90%] max-w-[90%] sm:w-[500px] sm:max-w-[500px] mx-auto rounded-xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of the inventory item."
              : "Fill in the details to add a new inventory item."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Item name" maxLength={20} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full sm:w-auto">
                {isEditing ? "Update" : "Add"} Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}