import React from 'react'
import Modal from './Modal'
import Button from './Button'

/**
 * Accessible replacement for window.confirm(). Controlled via `open`.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <span className="sr-only">{description}</span>
    </Modal>
  )
}
