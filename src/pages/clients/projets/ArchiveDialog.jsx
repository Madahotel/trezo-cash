import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/textarea';
import { Archive } from 'lucide-react';

const ArchiveDialog = ({
    open,
    onOpenChange,
    selectedProject,
    archiveReason,
    setArchiveReason,
    onConfirm,
    loading,
}) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-gray-900">Archiver le projet</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-500">
                        Êtes-vous sûr de vouloir archiver ce projet ? Il sera déplacé vers les archives.
                        {selectedProject && (
                            <div className="mt-2 font-medium text-gray-700">
                                {selectedProject.name}
                            </div>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-2 py-4">
                    <Label htmlFor="archiveReason" className="text-gray-700">Raison de l'archivage (optionnel)</Label>
                    <Textarea
                        id="archiveReason"
                        value={archiveReason}
                        onChange={(e) => setArchiveReason(e.target.value)}
                        placeholder="Ex: Projet terminé, En pause, Budget épuisé..."
                        rows={3}
                        className="border-gray-300"
                    />
                </div>

            <AlertDialogFooter>
                    <AlertDialogCancel 
                        onClick={() => setArchiveReason('')}
                        disabled={loading}
                    >
                        Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={onConfirm} 
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                            <Archive className="w-4 h-4 mr-2" />
                        )}
                        {loading ? 'Archivage...' : 'Archiver'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ArchiveDialog;