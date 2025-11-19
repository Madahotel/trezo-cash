import React, { useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { useData } from '../../../components/context/DataContext.jsx';
import { useUI } from '../../../components/context/UIContext.jsx';

const CommentButton = ({ rowId, columnId, rowName, columnName }) => {
    const { dataState: budgetDataState } = useData();
    const { uiState: budgetUIState, uiDispatch: budgetUIDispatch } = useUI();
    const { allComments: budgetAllComments } = budgetDataState;
    const { activeProjectId: budgetActiveProjectId } = budgetUIState;

    const commentsForCell = useMemo(() => {
        try {
            const projectId = budgetActiveProjectId;
            
            if (projectId === 'consolidated') {
                return [];
            }
            
            if (projectId && typeof projectId === 'string' && projectId.startsWith('consolidated_view_')) {
                return [];
            }
            
            return (budgetAllComments[projectId] || []).filter(c => c.rowId === rowId && c.columnId === columnId);
        } catch (error) {
            console.error('Erreur dans CommentButton:', error);
            return [];
        }
    }, [budgetAllComments, budgetActiveProjectId, rowId, columnId]);

    const handleOpenCommentDrawer = (e) => {
        e.stopPropagation();
        budgetUIDispatch({ type: 'OPEN_COMMENT_DRAWER', payload: { rowId, columnId, rowName, columnName } });
    };

    const hasComments = commentsForCell.length > 0;

    return (
        <button 
            onClick={handleOpenCommentDrawer}
            className={`absolute top-1/2 -translate-y-1/2 right-0 p-0.5 hover:text-blue-600 transition-opacity z-10 ${hasComments ? 'opacity-100 text-blue-600' : 'opacity-0 text-gray-400 group-hover/subcell:opacity-100'}`}
            title="Commentaires"
        >
            <MessageSquare className="w-3 h-3" />
            {hasComments && (
                <span className="absolute flex items-center justify-center w-3 h-3 text-white bg-blue-500 rounded-full -top-1 -right-1" style={{ fontSize: '0.6rem' }}>
                    {commentsForCell.length}
                </span>
            )}
        </button>
    );
};

export default CommentButton;