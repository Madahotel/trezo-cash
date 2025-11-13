import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../../components/ui/dialog';
import { Label } from '../../../../components/ui/Label';
import { Plus } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';

export const AddSubcategoryDialog = ({
  isOpen,
  onOpenChange,
  onSave,
  category,
}) => {
  const [subcategoryName, setSubcategoryName] = useState('');

  const handleSave = () => {
    if (subcategoryName.trim()) {
      onSave(category, subcategoryName);
      setSubcategoryName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une sous-catégorie</DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle sous-catégorie à "{category?.name}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="subcategoryName">Nom de la sous-catégorie</Label>
            <Input
              id="subcategoryName"
              value={subcategoryName}
              onChange={(e) => setSubcategoryName(e.target.value)}
              placeholder="Ex: Abonnements"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
