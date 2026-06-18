/** После любого изменения объявления — снова на модерацию */
export function moderationFieldsAfterEdit(currentStatus: string): {
  status?: 'moderation'
  reject_reason?: null
} {
  if (currentStatus === 'published' || currentStatus === 'archived') {
    return { status: 'moderation', reject_reason: null }
  }
  if (currentStatus === 'draft') {
    return { status: 'moderation' }
  }
  return {}
}

export function moderationNotice(currentStatus: string): string | null {
  if (currentStatus === 'published') {
    return 'После сохранения объявление снова уйдёт на проверку админом и временно скроется из каталога.'
  }
  if (currentStatus === 'archived') {
    return 'После сохранения объявление снова отправится на модерацию.'
  }
  if (currentStatus === 'moderation') {
    return 'Изменения сохранятся — объявление остаётся на проверке.'
  }
  return null
}
