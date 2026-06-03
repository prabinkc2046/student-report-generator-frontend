'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface EditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: string;
  studentName: string;
  onSave: (editedReport: string) => void;
  onAIEdit: (editMessage: string) => Promise<void>;
  isAIEditing?: boolean;
}

export function EditReportModal({
  isOpen,
  onClose,
  report,
  studentName,
  onSave,
  onAIEdit,
  isAIEditing = false
}: EditReportModalProps) {
  const [editMode, setEditMode] = useState<'direct' | 'ai'>('direct');
  const [editedReport, setEditedReport] = useState(report);
  const [editMessage, setEditMessage] = useState('');

  // Reset state when modal opens with new report
  useEffect(() => {
    if (isOpen) {
      setEditedReport(report);
      setEditMessage('');
      setEditMode('direct');
    }
  }, [isOpen, report]);

  const handleDirectEdit = () => {
    onSave(editedReport);
    onClose();
  };

  const handleAIEdit = async () => {
    if (!editMessage.trim()) return;
    await onAIEdit(editMessage);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Report - {studentName}</DialogTitle>
          <DialogDescription>
            Make changes to the report manually or use AI to help
          </DialogDescription>
        </DialogHeader>

        <Tabs value={editMode} onValueChange={(v) => setEditMode(v as 'direct' | 'ai')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct">Direct Edit</TabsTrigger>
            <TabsTrigger value="ai">AI Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4 mt-4">
            <Textarea
              value={editedReport}
              onChange={(e) => setEditedReport(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Edit the report directly..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleDirectEdit}>
                Save Changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Edit Instructions</label>
              <Textarea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                placeholder="Example: Make the tone warmer, add more about social skills, or focus more on mathematics progress..."
                className="min-h-[150px]"
                disabled={isAIEditing}
              />
              <p className="text-xs text-muted-foreground">
                Describe what changes you want to make to the report. The AI will help revise it while keeping the professional tone.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview of Current Report</label>
              <div className="bg-muted/30 rounded-lg p-4 max-h-[200px] overflow-y-auto">
                <p className="text-sm text-muted-foreground">{report}</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isAIEditing}>
                Cancel
              </Button>
              <Button 
                onClick={handleAIEdit} 
                disabled={isAIEditing || !editMessage.trim()}
              >
                {isAIEditing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Editing...
                  </>
                ) : (
                  'Apply AI Edit'
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}