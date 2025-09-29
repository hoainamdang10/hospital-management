'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  User,
  Building2,
  FileText,
  Stethoscope,
  ArrowRight,
  Command,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { mockSearchResults, SearchResult } from '@/lib/mock';
import { useRouter } from 'next/navigation';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const { t, language } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter results based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) return mockSearchResults.slice(0, 8); // Show top 8 when no query

    const searchTerm = query.toLowerCase().trim();
    
    return mockSearchResults.filter(result => {
      const title = (language === 'vi' ? result.titleVi : result.title).toLowerCase();
      const description = (language === 'vi' ? result.descriptionVi : result.description)?.toLowerCase() || '';
      
      return title.includes(searchTerm) || description.includes(searchTerm);
    }).slice(0, 10); // Limit to 10 results
  }, [query, language]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    
    filteredResults.forEach(result => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });
    
    return groups;
  }, [filteredResults]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredResults.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredResults.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredResults[selectedIndex]) {
            handleSelect(filteredResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onClose]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    onClose();
    setQuery('');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'doctor':
        return User;
      case 'department':
        return Building2;
      case 'page':
        return FileText;
      case 'service':
        return Stethoscope;
      default:
        return Search;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'doctor':
        return t('search.doctors');
      case 'department':
        return t('search.departments');
      case 'page':
        return t('search.pages');
      case 'service':
        return t('search.services');
      default:
        return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'doctor':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      case 'department':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      case 'page':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300';
      case 'service':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground mr-3" />
          <Input
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            autoFocus
          />
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-3">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('search.noResults')}</p>
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedResults).map(([type, results]) => (
                <div key={type} className="mb-4 last:mb-0">
                  {/* Group Header */}
                  <div className="flex items-center gap-2 px-2 py-1 mb-2">
                    <div className="h-4 w-4 flex items-center justify-center">
                      {(() => {
                        const Icon = getTypeIcon(type);
                        return <Icon className="h-3 w-3 text-muted-foreground" />;
                      })()}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {getTypeLabel(type)}
                    </span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>

                  {/* Group Results */}
                  {results.map((result, index) => {
                    const globalIndex = filteredResults.indexOf(result);
                    const isSelected = globalIndex === selectedIndex;
                    
                    return (
                      <div
                        key={result.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-accent text-accent-foreground' 
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => handleSelect(result)}
                      >
                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                          {(() => {
                            const Icon = getTypeIcon(result.type);
                            return <Icon className="h-4 w-4" />;
                          })()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">
                              {language === 'vi' ? result.titleVi : result.title}
                            </span>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getTypeBadgeColor(result.type)}`}
                            >
                              {getTypeLabel(result.type)}
                            </Badge>
                          </div>
                          {(result.description || result.descriptionVi) && (
                            <p className="text-sm text-muted-foreground truncate">
                              {language === 'vi' ? result.descriptionVi : result.description}
                            </p>
                          )}
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ↑↓
                </kbd>
                <span>{language === 'vi' ? 'điều hướng' : 'navigate'}</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ↵
                </kbd>
                <span>{language === 'vi' ? 'chọn' : 'select'}</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  esc
                </kbd>
                <span>{language === 'vi' ? 'đóng' : 'close'}</span>
              </div>
            </div>
            <span>{filteredResults.length} {language === 'vi' ? 'kết quả' : 'results'}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
