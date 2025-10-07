'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, PlusCircle, Edit, Trash2, Upload, X, Save, FileDown, Loader2, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { cn } from '@/lib/utils';
import type { Product, Category } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { generateMenuHtmlReport } from '@/app/export/actions';
import { Separator } from './ui/separator';


interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  specialPrintCategoryId: string | null;
  setSpecialPrintCategoryId: React.Dispatch<React.SetStateAction<string | null>>;
}

type ProductFormState = Partial<Product> & { imagePreview?: string };
type CategoryFormState = Partial<Category>;

export function CategoriesModal({ isOpen, onClose, specialPrintCategoryId, setSpecialPrintCategoryId }: CategoriesModalProps) {
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [productForm, setProductForm] = useState<ProductFormState>({});
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'product' | 'category', id: string} | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const [catRes, prodRes, settingsRes] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/products'),
            fetch('/api/settings')
        ]);
        if (!catRes.ok || !prodRes.ok) throw new Error("Failed to fetch data");
        
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        
        setCategories(catData);
        setProducts(prodData);
        
        if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            setSpecialPrintCategoryId(settingsData.special_print_category_id || null);
        }

    } catch (error) {
        toast({ variant: "destructive", title: "خطأ", description: "فشل في جلب بيانات الأصناف."});
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
        fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);


  const filteredProducts = useMemo(() => 
    products.filter(p => {
      const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const categoryMatch = !selectedCategory || p.categoryId === selectedCategory.id;
      return searchMatch && categoryMatch;
    }),
    [products, searchQuery, selectedCategory]
  );
  
  // Handlers for product selection and form state
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({ ...product, imagePreview: product.imageUrl });
  };
  
  const handleAddNewProduct = () => {
    setSelectedProduct(null);
    setProductForm({ categoryId: selectedCategory?.id });
  };

  const handleProductFormChange = (field: keyof ProductFormState, value: string | number) => {
    setProductForm(prev => ({...prev, [field]: value}));
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, imagePreview: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price || !productForm.categoryId) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى ملء اسم المنتج والسعر والفئة.' });
        return;
    }
    
    const isEditing = !!selectedProduct;
    const url = isEditing ? `/api/products/${selectedProduct.id}` : '/api/products';
    const method = isEditing ? 'PUT' : 'POST';
    
    const payload = {
        name: productForm.name,
        price: Number(productForm.price),
        categoryId: productForm.categoryId,
        imageUrl: productForm.imagePreview || 'https://picsum.photos/seed/placeholder/400/300',
        description: productForm.description,
    };

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Save product error:", errorText);
          throw new Error(`Failed to ${isEditing ? 'update' : 'create'} product.`);
        }
        
        toast({ title: 'تم الحفظ', description: `تم ${isEditing ? 'تحديث' : 'حفظ'} المنتج بنجاح.` });
        fetchData(); // Refetch all data
        handleAddNewProduct();
    } catch (error) {
        toast({ variant: 'destructive', title: 'خطأ', description: `فشل ${isEditing ? 'تحديث' : 'حفظ'} المنتج.`});
    }
  };

  // Handlers for category selection and form state
  const handleSelectCategory = (category: Category | null) => {
    setSelectedCategory(category);
    if(category){
        setCategoryForm({ ...category });
    } else {
        setCategoryForm({});
    }
    handleAddNewProduct();
  };

  const handleAddNewCategory = () => {
    setSelectedCategory(null);
    setCategoryForm({});
  };

  const handleCategoryFormChange = (field: keyof CategoryFormState, value: string) => {
    setCategoryForm(prev => ({...prev, [field]: value}));
  };
  
  const handleSaveCategory = async () => {
    if (!categoryForm.name) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى إدخال اسم الفئة.'});
        return;
    }

    const isEditing = !!selectedCategory;
    const url = isEditing ? `/api/categories/${selectedCategory.id}` : '/api/categories';
    const method = isEditing ? 'PUT' : 'POST';

     try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryForm)
        });
        if (!response.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} category.`);
        
        toast({ title: 'تم الحفظ', description: `تم ${isEditing ? 'تحديث' : 'حفظ'} الفئة بنجاح.` });
        fetchData();
        handleAddNewCategory();
    } catch (error) {
        toast({ variant: 'destructive', title: 'خطأ', description: `فشل ${isEditing ? 'تحديث' : 'حفظ'} الفئة.`});
    }
  };
  
  // Delete handler
  const handleDeleteClick = (type: 'product' | 'category', id: string) => {
    setItemToDelete({ type, id });
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    const { type, id } = itemToDelete;
    const url = `/api/${type}s/${id}`;

    try {
        const response = await fetch(url, { method: 'DELETE' });
        if (!response.ok) throw new Error(`Failed to delete ${type}`);
        
        toast({ title: 'تم الحذف بنجاح' });
        fetchData();
        if (type === 'product' && selectedProduct?.id === id) handleAddNewProduct();
        if (type === 'category' && selectedCategory?.id === id) handleAddNewCategory();

    } catch (error) {
        toast({ variant: 'destructive', title: 'خطأ في الحذف', description: `فشل حذف ${type}. قد يكون مرتبطًا ببيانات أخرى.`});
    } finally {
        setIsAlertOpen(false);
        setItemToDelete(null);
    }
  };

  const handleExportMenu = async () => {
    setIsExporting(true);
    toast({ title: 'جاري إنشاء القائمة...', description: 'قد تستغرق هذه العملية بضع لحظات.' });
    try {
      const reportHtml = await generateMenuHtmlReport({ products, categories });
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'restaurant-menu.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: 'اكتمل الإنشاء', description: 'تم تنزيل قائمة الطعام بنجاح.' });
    } catch (error) {
      console.error("Menu export failed:", error);
      toast({ variant: "destructive", title: 'فشل الإنشاء', description: 'حدث خطأ أثناء إنشاء القائمة.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveSpecialPrintCategory = async (categoryId: string | null) => {
    setSpecialPrintCategoryId(categoryId);
    try {
        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'special_print_category_id': categoryId }),
        });
        toast({ title: 'تم الحفظ', description: 'تم حفظ إعدادات الطباعة.'});
    } catch (error) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حفظ إعدادات الطباعة.' });
    }
  }


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl p-0">
          <DialogHeader className="p-6 pb-2 bg-primary text-primary-foreground">
            <DialogTitle className="text-2xl">إدارة الأصناف</DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
              إضافة وتعديل وحذف المنتجات والفئات.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 pt-2 relative">
            {isLoading && <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}
            
            {/* Right Panel - Categories */}
            <div className="md:col-span-3 flex flex-col gap-4">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>الفئات</CardTitle>
                    <Button variant="ghost" size="icon" onClick={handleAddNewCategory}>
                      <PlusCircle className="h-5 w-5 text-primary" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-2 overflow-y-auto">
                    <div className="flex flex-col gap-2">
                        <Button
                            variant={!selectedCategory ? 'secondary' : 'ghost'}
                            className="w-full justify-start h-12 text-base"
                            onClick={() => handleSelectCategory(null)}
                        >
                            كل الفئات
                        </Button>
                        {categories.map(cat => (
                            <Button
                                key={cat.id}
                                variant={selectedCategory?.id === cat.id ? 'secondary' : 'ghost'}
                                className="w-full justify-start h-12 text-base"
                                onClick={() => handleSelectCategory(cat)}
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                </CardContent>
                 <CardFooter className='p-2 flex-col items-start gap-2'>
                  <Separator />
                    <Label className="p-2 text-base font-semibold">إعدادات الطباعة</Label>
                     <div className="w-full p-2 space-y-2">
                        <Label htmlFor="special-print-category">فئة الطباعة الثالثة</Label>
                        <Select value={specialPrintCategoryId || 'none'} onValueChange={(val) => handleSaveSpecialPrintCategory(val === 'none' ? null : val)}>
                            <SelectTrigger id="special-print-category">
                                <SelectValue placeholder="اختر فئة..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">بدون</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className='text-xs text-muted-foreground'>عند الطلب من هذه الفئة، ستتم طباعة فاتورة مطبخ ثالثة.</p>
                    </div>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{selectedCategory ? 'تعديل فئة' : 'إضافة فئة جديدة'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="cat-name">اسم الفئة</Label>
                     <Input id="cat-name" value={categoryForm.name || ''} onChange={(e) => handleCategoryFormChange('name', e.target.value)} />
                   </div>
                   <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleSaveCategory}><Save className="ml-2 h-4 w-4" /> حفظ</Button>
                    {selectedCategory && (
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteClick('category', selectedCategory.id)}><Trash2 className="h-4 w-4" /></Button>
                    )}
                   </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Middle Panel - Product Form */}
            <div className="md:col-span-4 flex flex-col">
                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>{selectedProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</CardTitle>
                             <Button variant="ghost" size="icon" onClick={handleAddNewProduct}>
                                <PlusCircle className="h-5 w-5 text-primary" />
                            </Button>
                        </div>
                        {selectedProduct && <CardDescription>المنتج المحدد: {selectedProduct.name}</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 overflow-y-auto pr-2">
                        <div className="space-y-2">
                            <Label htmlFor="prod-name">اسم المنتج</Label>
                            <Input id="prod-name" value={productForm.name || ''} onChange={(e) => handleProductFormChange('name', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="prod-price">سعر المنتج</Label>
                                <Input id="prod-price" type="number" value={productForm.price || ''} onChange={(e) => handleProductFormChange('price', e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="prod-cat">فئة المنتج</Label>
                                <Select value={productForm.categoryId || ''} onValueChange={(value) => handleProductFormChange('categoryId', value)}>
                                    <SelectTrigger id="prod-cat">
                                        <SelectValue placeholder="اختر فئة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>صورة المنتج</Label>
                            <Card className="aspect-video w-full relative group bg-muted overflow-hidden">
                                {productForm.imagePreview ? (
                                    <>
                                        <Image src={productForm.imagePreview} alt="معاينة" layout="fill" objectFit="cover" />
                                        <Button variant="destructive" size="icon" className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100" onClick={() => setProductForm(prev => ({...prev, imagePreview: undefined}))}>
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                        <Upload className="h-10 w-10 mb-2"/>
                                        <span>ارفع صورة</span>
                                    </div>
                                )}
                                <Input id="image-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleProductImageUpload}/>
                            </Card>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="prod-desc">وصف المنتج</Label>
                            <Textarea id="prod-desc" placeholder="وصف قصير للمنتج (اختياري)" value={productForm.description || ''} onChange={(e) => handleProductFormChange('description', e.target.value)}/>
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 border-t">
                        <div className="flex w-full gap-2">
                            <Button className="flex-1" onClick={handleSaveProduct}><Save className="ml-2 h-4 w-4" /> {selectedProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}</Button>
                            {selectedProduct && <Button variant="destructive" onClick={() => handleDeleteClick('product', selectedProduct.id)}><Trash2 className="ml-2 h-4 w-4" /> حذف المنتج</Button>}
                        </div>
                    </CardFooter>
                </Card>
            </div>
            
            {/* Left Panel - Products List */}
            <div className="md:col-span-5 flex flex-col">
               <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                      placeholder="بحث في المنتجات..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      />
                  </div>
                   <Button variant="outline" onClick={handleExportMenu} disabled={isExporting}>
                    {isExporting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <FileDown className="ml-2 h-4 w-4" />}
                    تصدير القائمة
                   </Button>
              </div>
              <Card className="flex-1 flex flex-col">
                <CardContent className="p-0 flex-1">
                  <ScrollArea className="h-full">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-primary hover:bg-primary/90">
                          <TableHead className="w-20 text-primary-foreground text-center">الصورة</TableHead>
                          <TableHead className="text-primary-foreground text-center">اسم المنتج</TableHead>
                          <TableHead className="text-primary-foreground text-center">الفئة</TableHead>
                          <TableHead className="text-primary-foreground text-center">السعر</TableHead>
                          <TableHead className="text-primary-foreground text-center">تعديل</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow
                            key={product.id}
                            onClick={() => handleSelectProduct(product)}
                            className={cn('cursor-pointer', selectedProduct?.id === product.id && 'bg-muted/80')}
                          >
                            <TableCell className="text-center">
                                <Image src={product.imageUrl} alt={product.name} width={48} height={48} className="rounded-md object-cover aspect-square mx-auto"/>
                            </TableCell>
                            <TableCell className="font-medium text-center">{product.name}</TableCell>
                            <TableCell className="text-center">{categories.find(c=>c.id === product.categoryId)?.name}</TableCell>
                            <TableCell className="text-center">{product.price.toLocaleString('ar-SA')} ر.ي</TableCell>
                            <TableCell className="text-center">
                                <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); handleSelectProduct(product);}}>
                                    <Edit className="h-4 w-4 text-blue-500" />
                                </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد أنك تريد حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
