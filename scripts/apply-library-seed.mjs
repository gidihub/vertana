const PENDING_SUFFIX = "__seed_pending"
const REPLACED_SUFFIX = "__replaced"

function pendingCategory(category) {
  return `${category}${PENDING_SUFFIX}`
}

function replacedCategory(category) {
  return `${category}${REPLACED_SUFFIX}`
}

async function deleteCategory(supabase, category) {
  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("is_library_item", true)
    .eq("library_category", category)

  if (error) throw new Error(`Delete ${category} failed: ${error.message}`)
}

async function renameCategory(supabase, from, to) {
  const { error } = await supabase
    .from("questions")
    .update({ library_category: to })
    .eq("is_library_item", true)
    .eq("library_category", from)

  if (error) throw new Error(`Rename ${from} → ${to} failed: ${error.message}`)
}

async function insertBatches(supabase, rows, batchSize) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase.from("questions").insert(batch)
    if (error) {
      throw new Error(
        `Insert failed at batch ${i / batchSize + 1}/${Math.ceil(rows.length / batchSize)}: ${error.message}`,
      )
    }
    console.log(
      `Inserted batch ${i / batchSize + 1}/${Math.ceil(rows.length / batchSize)}`,
    )
  }
}

/**
 * Replace library rows for a category without leaving the library empty if inserts fail.
 * 1. Insert new rows under a pending slug (old rows untouched).
 * 2. On full success, swap pending into place and remove the previous set.
 */
export async function replaceLibraryCategory(
  supabase,
  { category, rows, batchSize = 25 },
) {
  const pending = pendingCategory(category)
  const replaced = replacedCategory(category)

  await deleteCategory(supabase, pending)
  await deleteCategory(supabase, replaced)

  const pendingRows = rows.map((row) => ({
    ...row,
    library_category: pending,
    category_id: row.category_id ?? category,
  }))

  let swapped = false

  try {
    await insertBatches(supabase, pendingRows, batchSize)
    await renameCategory(supabase, category, replaced)
    await renameCategory(supabase, pending, category)
    swapped = true
    await deleteCategory(supabase, replaced)
  } catch (err) {
    console.error(err.message)
    console.error("Rolling back: removing partial pending rows; prior library kept.")
    try {
      await deleteCategory(supabase, pending)
      if (!swapped) {
        await renameCategory(supabase, replaced, category)
      }
    } catch (rollbackErr) {
      console.error("Rollback failed:", rollbackErr.message)
      console.error(
        `Manual cleanup may be required for categories: ${pending}, ${replaced}, ${category}`,
      )
    }
    throw err
  }
}

export async function countLibraryCategory(supabase, category) {
  const { count, error } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("is_library_item", true)
    .eq("library_category", category)

  if (error) throw new Error(`Count failed: ${error.message}`)
  return count
}

/** Append rows after existing library items in a category (idempotent offset). */
export async function appendLibraryCategory(
  supabase,
  { category, rows, startOrder = 0, batchSize = 25 },
) {
  if (!rows.length) return

  const endOrder = startOrder + rows.length - 1
  const { data: existing, error } = await supabase
    .from("questions")
    .select("order_index")
    .eq("is_library_item", true)
    .eq("library_category", category)
    .gte("order_index", startOrder)
    .lte("order_index", endOrder)

  if (error) throw new Error(`Lookup failed: ${error.message}`)

  const present = new Set((existing ?? []).map((r) => r.order_index))
  const toInsert = rows
    .map((row, i) => ({ row, orderIndex: startOrder + i }))
    .filter(({ orderIndex }) => !present.has(orderIndex))

  if (!toInsert.length) {
    console.log(
      `${category}: order_index ${startOrder}–${endOrder} already present — skipping append`,
    )
    return
  }

  const withMeta = toInsert.map(({ row, orderIndex }) => ({
    ...row,
    library_category: category,
    category_id: row.category_id ?? category,
    order_index: orderIndex,
  }))
  await insertBatches(supabase, withMeta, batchSize)
}
