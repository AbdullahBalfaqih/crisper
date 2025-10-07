'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Wrench } from 'lucide-react';

interface ManagementPlaceholderModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export function ManagementPlaceholderModal({
  isOpen,
  onClose,
  title,
}: ManagementPlaceholderModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إدارة {title}</DialogTitle>
          <DialogDescription>
            سيتم تنفيذ وظائف CRUD الكاملة لـ {title.toLowerCase()} هنا.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
          <Wrench className="h-16 w-16" />
          <p className="text-center">هذا القسم قيد الإنشاء.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
