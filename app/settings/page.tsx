// app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, CheckCircle2, AlertCircle, RefreshCw, Settings2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Attribute, bulkUpdateAttributes, getAllAttributes, initializeDefaultAttributes } from '../actions/attribute-action';

export default function SettingsPage() {
  const [attributes, setAttributes] = useState<Record<string, Attribute[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalState, setOriginalState] = useState<Record<string, Attribute[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      setIsLoading(true);
      const result = await getAllAttributes();
      if (result.success) {
        setAttributes(result.attributes);
        setOriginalState(JSON.parse(JSON.stringify(result.attributes)));
        // Expand all categories by default
        const allCategories = Object.keys(result.attributes);
        setExpandedCategories(new Set(allCategories));
      } else {
        toast.error(result.error || 'Failed to load attributes');
      }
    } catch (error) {
      console.error('Error fetching attributes:', error);
      toast.error('Failed to load attributes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeDefaults = async () => {
    if (confirm('This will reset all attributes to default values. Any changes will be lost. Continue?')) {
      setIsInitializing(true);
      try {
        const result = await initializeDefaultAttributes();
        if (result.success) {
          toast.success('Attributes initialized successfully');
          await fetchAttributes();
        } else {
          toast.error(result.error || 'Failed to initialize attributes');
        }
      } catch (error) {
        console.error('Error initializing attributes:', error);
        toast.error('Failed to initialize attributes');
      } finally {
        setIsInitializing(false);
      }
    }
  };

  const handleToggleAttribute = (category: string, attributeId: string, currentValue: boolean) => {
    setAttributes(prev => ({
      ...prev,
      [category]: prev[category].map(attr =>
        attr.id === attributeId ? { ...attr, isEnabled: !currentValue } : attr
      ),
    }));
    setHasChanges(true);
  };

  const handleToggleCategory = (category: string, attributes: Attribute[]) => {
    const allEnabled = attributes.every(attr => attr.isEnabled);
    setAttributes(prev => ({
      ...prev,
      [category]: prev[category].map(attr => ({
        ...attr,
        isEnabled: !allEnabled,
      })),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: { id: string; isEnabled: boolean }[] = [];
      Object.values(attributes).forEach(categoryAttributes => {
        categoryAttributes.forEach(attr => {
          const originalAttr = originalState[attr.category]?.find(o => o.id === attr.id);
          if (originalAttr && originalAttr.isEnabled !== attr.isEnabled) {
            updates.push({ id: attr.id, isEnabled: attr.isEnabled });
          }
        });
      });

      if (updates.length === 0) {
        toast.info('No changes to save');
        setIsSaving(false);
        return;
      }

      const result = await bulkUpdateAttributes(updates);
      if (result.success) {
        toast.success(`Saved ${updates.length} attribute changes`);
        setHasChanges(false);
        setOriginalState(JSON.parse(JSON.stringify(attributes)));
        window.dispatchEvent(new Event('storage'));
      } else {
        toast.error(result.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving attributes:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const getTotalEnabledCount = () => {
    let count = 0;
    Object.values(attributes).forEach(categoryAttributes => {
      count += categoryAttributes.filter(attr => attr.isEnabled).length;
    });
    return count;
  };

  const getTotalAttributesCount = () => {
    let count = 0;
    Object.values(attributes).forEach(categoryAttributes => {
      count += categoryAttributes.length;
    });
    return count;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const toggleAllCategories = (expand: boolean) => {
    if (expand) {
      setExpandedCategories(new Set(categories));
    } else {
      setExpandedCategories(new Set());
    }
  };

  // Filter attributes based on search term
  const getFilteredAttributes = () => {
    if (!searchTerm) return attributes;
    
    const filtered: Record<string, Attribute[]> = {};
    Object.entries(attributes).forEach(([category, attrs]) => {
      const matchedAttrs = attrs.filter(attr => 
        attr.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matchedAttrs.length > 0) {
        filtered[category] = matchedAttrs;
      }
    });
    return filtered;
  };

  const filteredAttributes = getFilteredAttributes();
  const categories = Object.keys(filteredAttributes).sort();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto py-12 px-4 max-w-4xl">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading attributes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-3">
            <Settings2 className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Characteristic Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage which student characteristics appear on the report generation page
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{getTotalAttributesCount()}</p>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border text-center">
            <p className="text-xs text-muted-foreground">Enabled</p>
            <p className="text-xl font-bold text-green-600">{getTotalEnabledCount()}</p>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border text-center">
            <p className="text-xs text-muted-foreground">Disabled</p>
            <p className="text-xl font-bold text-red-600">
              {getTotalAttributesCount() - getTotalEnabledCount()}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search characteristics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex-1 gap-1"
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            onClick={handleInitializeDefaults}
            variant="outline"
            disabled={isInitializing}
            size="sm"
            className="gap-1"
          >
            {isInitializing ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                Reset
              </>
            )}
          </Button>
        </div>

        {/* Attributes List */}
        {categories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No attributes found</p>
              <Button 
                onClick={handleInitializeDefaults} 
                variant="outline" 
                className="mt-4"
                disabled={isInitializing}
              >
                Initialize Default Attributes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Expand/Collapse All Button */}
            {!searchTerm && categories.length > 1 && (
              <div className="flex justify-end gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAllCategories(true)}
                  className="text-xs h-7"
                >
                  Expand All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAllCategories(false)}
                  className="text-xs h-7"
                >
                  Collapse All
                </Button>
              </div>
            )}

            {categories.map((category) => {
              const categoryAttributes = filteredAttributes[category];
              const enabledCount = categoryAttributes.filter(a => a.isEnabled).length;
              const isExpanded = expandedCategories.has(category);
              
              return (
                <Card key={category} className="overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm">{category}</span>
                        <span className="text-xs text-muted-foreground">
                          ({enabledCount}/{categoryAttributes.length})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCategory(category, categoryAttributes);
                        }}
                        className="text-xs h-7"
                      >
                        {enabledCount === categoryAttributes.length ? 'Disable All' : 'Enable All'}
                      </Button>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="border-t px-4 py-3 space-y-2">
                      {categoryAttributes.map((attribute) => (
                        <div
                          key={attribute.id}
                          className="flex items-center justify-between py-2"
                        >
                          <label className="text-sm cursor-pointer flex-1 pr-4">
                            {attribute.name}
                          </label>
                          <Switch
                            checked={attribute.isEnabled}
                            onCheckedChange={() => handleToggleAttribute(category, attribute.id, attribute.isEnabled)}
                            className="data-[state=checked]:bg-primary flex-shrink-0"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Unsaved Changes Alert */}
        {hasChanges && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/90 shadow-lg py-2">
              <AlertCircle className="h-3 w-3 text-yellow-500" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-300 flex items-center gap-3 text-sm">
                <span>Unsaved changes</span>
                <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-7 text-xs gap-1">
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  Save
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}