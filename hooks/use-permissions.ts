import { useEffect, useState } from 'react'
import type { Permission } from '@/lib/types'

export function usePermissions(moduleId: string) {
  const [permissions, setPermissions] = useState<Permission | null>(null)

  useEffect(() => {
    // Get user permissions from localStorage/context
    const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]')
    const modulePermissions = userPermissions.find((p: Permission) => p.moduleId === moduleId)
    setPermissions(modulePermissions || null)
  }, [moduleId])

  return {
    canView: permissions?.canView ?? false,
    canAdd: permissions?.canAdd ?? false,
    canEdit: permissions?.canEdit ?? false,
    canDelete: permissions?.canDelete ?? false,
  }
} 