
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast.tsx';
import { RecipeCardReceipt } from './recipe-card-receipt';
import type { Category } from '@/lib/types';
import { Loader2, Plus, Printer, Save, Trash2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';


interface RecipesModalProps {
  isOpen: boolean;
  onClose: () => void;
}


export type Recipe = { 
  id: number; 
  name: string; 
  category_id: string; 
  category_name?: string;
  prep_time_minutes: number; 
  cook_time_minutes: number; 
  ingredients: string; 
  instructions: string; 
};

type FormState = Partial<Omit<Recipe, 'id'>> & { category_name?: string };


export function RecipesModal({ isOpen, onClose }: RecipesModalProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [formState, setFormState] = useState<FormState>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('كرسبر');


  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
        const [recipesRes, categoriesRes, settingsRes] = await Promise.all([
            fetch('/api/recipes'),
            fetch('/api/categories'),
            fetch('/api/settings'),
        ]);

        if (!recipesRes.ok || !categoriesRes.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const recipesData = await recipesRes.json();
        const categoriesData = await categoriesRes.json();

        setRecipes(recipesData);
        setCategories(categoriesData);

        if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            setLogo(settingsData.logo_base64 || null);
            setRestaurantName(settingsData.restaurant_name || 'كرسبر');
        }

    } catch (error) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب البيانات.' });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedRecipe) {
      setFormState({ 
          ...selectedRecipe,
          category_name: categories.find(c => c.id === selectedRecipe.category_id)?.name
      });
    } else {
      resetForm();
    }
  }, [selectedRecipe, categories]);

  const resetForm = () => {
    setFormState({
      name: '',
      category_id: undefined,
      category_name: '',
      prep_time_minutes: 0,
      cook_time_minutes: 0,
      ingredients: '',
      instructions: '',
    });
    setSelectedRecipe(null);
  };
  
  const handleInputChange = (field: keyof FormState, value: string | number) => {
    setFormState(prev => ({...prev, [field]: value}));
  };

  const handleSave = async () => {
    if (!formState.name || !formState.category_name) {
        toast({ variant: "destructive", title: "خطأ", description: "اسم الوصفة والتصنيف مطلوبان."});
        return;
    }

    setIsLoading(true);

    let categoryId = categories.find(c => c.name === formState.category_name)?.id;

    // If category does not exist, create it
    if (!categoryId) {
        try {
            const catResponse = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: formState.category_name })
            });
            if (!catResponse.ok) throw new Error('Failed to create new category');
            const newCategory = await catResponse.json();
            categoryId = newCategory.id;
            // Update categories state locally to avoid another fetch
            setCategories(prev => [...prev, newCategory]);
        } catch (error) {
             toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في إنشاء التصنيف الجديد.' });
             setIsLoading(false);
             return;
        }
    }

    const payload = {
        ...formState,
        category_id: categoryId,
    };
    
    delete payload.category_name;


    const isEditing = !!selectedRecipe;
    const url = isEditing ? `/api/recipes/${selectedRecipe.id}` : '/api/recipes';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save recipe');
        }

        toast({ title: "تم بنجاح", description: `تم ${isEditing ? 'تعديل' : 'إضافة'} الوصفة.` });
        resetForm();
        await fetchData();

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ في الحفظ', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleDeleteClick = () => {
      if (!selectedRecipe) {
        toast({ variant: 'destructive', title: "خطأ", description: "يرجى تحديد وصفة لحذفها." });
        return;
      }
      setRecipeToDelete(selectedRecipe);
      setIsAlertOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!recipeToDelete) return;
    
    setIsLoading(true);
    try {
        const response = await fetch(`/api/recipes/${recipeToDelete.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete recipe');

        toast({ title: "تم الحذف", description: `تم حذف وصفة ${recipeToDelete.name}.` });
        resetForm();
        await fetchData();

    } catch(error) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الوصفة.'});
    } finally {
        setRecipeToDelete(null);
        setIsAlertOpen(false);
        setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (!selectedRecipe) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى تحديد وصفة لطباعتها.' });
      return;
    }
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = printRef.current?.innerHTML;
      if (printContent) {
        printWindow.document.write('<html><head><title>طباعة وصفة</title>');
        printWindow.document.write('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" rel="stylesheet">');
        printWindow.document.write('<style>@page { size: 80mm auto; margin: 0; } body { font-family: "Cairo", "Almarai", sans-serif; direction: rtl; } .break-after-page { page-break-after: always; }</style>');
        printWindow.document.write('</head><body onafterprint="window.close()">');
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
             {isLoading && <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            <DialogHeader className="p-4 bg-primary text-primary-foreground">
                <DialogTitle className="text-2xl">إدارة الوصفات</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 flex-1 overflow-y-auto">
                {/* Right Panel: Recipe List */}
                <Card className="flex flex-col">
                    <CardContent className="p-0">
                        <ScrollArea className="h-[calc(90vh-10rem)]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-muted/50 bg-primary/10">
                                        <TableHead className="text-primary text-center">اسم الوصفة</TableHead>
                                        <TableHead className="text-primary text-center">التصنيف</TableHead>
                                        <TableHead className="text-primary text-center">وقت التحضير</TableHead>
                                        <TableHead className="text-primary text-center">وقت الطهي</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recipes.map(recipe => (
                                        <TableRow 
                                            key={recipe.id}
                                            onClick={() => setSelectedRecipe(recipe)}
                                            className={cn('cursor-pointer', selectedRecipe?.id === recipe.id && 'bg-primary/20')}
                                        >
                                            <TableCell className="text-center font-semibold">{recipe.name}</TableCell>
                                            <TableCell className="text-center">{recipe.category_name}</TableCell>
                                            <TableCell className="text-center">{recipe.prep_time_minutes} د</TableCell>
                                            <TableCell className="text-center">{recipe.cook_time_minutes} د</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Left Panel: Recipe Form */}
                <Card className="flex flex-col">
                    <ScrollArea className="h-[calc(90vh-10rem)]">
                        <div className="p-6 space-y-4">
                            <h3 className="text-lg font-semibold mb-2">{selectedRecipe ? `تعديل وصفة: ${selectedRecipe.name}`: 'إضافة وصفة جديدة'}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="recipe-name">اسم الوصفة</Label>
                                    <Input id="recipe-name" value={formState.name || ''} onChange={e => handleInputChange('name', e.target.value)}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="recipe-category">تصنيف الوصفة</Label>
                                    <Input id="recipe-category" placeholder="مثل: وجبات رئيسية" value={formState.category_name || ''} onChange={e => handleInputChange('category_name', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="prep-time">وقت التحضير (دقيقة)</Label>
                                    <Input id="prep-time" type="number" value={formState.prep_time_minutes || 0} onChange={e => handleInputChange('prep_time_minutes', Number(e.target.value))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cook-time">وقت الطهي (دقيقة)</Label>
                                    <Input id="cook-time" type="number" value={formState.cook_time_minutes || 0} onChange={e => handleInputChange('cook_time_minutes', Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ingredients">المكونات (يفصل بينها بفاصلة)</Label>
                                <Textarea id="ingredients" value={formState.ingredients || ''} onChange={e => handleInputChange('ingredients', e.target.value)} rows={4}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instructions">طريقة التحضير (يفصل بين كل خطوة بنقطة)</Label>
                                <Textarea id="instructions" value={formState.instructions || ''} onChange={e => handleInputChange('instructions', e.target.value)} rows={6}/>
                            </div>
                        </div>
                    </ScrollArea>
                </Card>
            </div>

            <DialogFooter className="pt-4 border-t gap-2">
            <Button onClick={resetForm} variant="outline"><Plus className="ml-2"/>وصفة جديدة</Button>
            <Button onClick={handleDeleteClick} variant="destructive" disabled={!selectedRecipe}><Trash2 className="ml-2"/>حذف</Button>
            <Button onClick={handlePrint} variant="secondary" disabled={!selectedRecipe}><Printer className="ml-2"/>طباعة</Button>
            <div className="flex-grow"></div>
            <Button onClick={onClose} variant="ghost">إغلاق</Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white"><Save className="ml-2"/>{selectedRecipe ? 'حفظ التعديلات' : 'إضافة وحفظ'}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <div className="hidden">
      {selectedRecipe && <RecipeCardReceipt ref={printRef} recipe={{...selectedRecipe, category_name: categories.find(c=>c.id === selectedRecipe.category_id)?.name || '', restaurantName: restaurantName } as any} logo={logo} />}
    </div>

    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد أنك تريد حذف هذه الوصفة بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
            تأكيد
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
