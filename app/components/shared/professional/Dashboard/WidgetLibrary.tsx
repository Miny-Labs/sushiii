'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { WidgetLibraryItem, WidgetConfig } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Activity, 
  BarChart3, 
  Table, 
  List, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Zap,
  Users,
  DollarSign,
  Clock,
  Target,
  Shield,
  Globe
} from 'lucide-react';

interface WidgetLibraryProps {
  onWidgetAdd: (widget: WidgetConfig) => void;
  className?: string;
}

// Default widget library items
const defaultWidgetLibrary: WidgetLibraryItem[] = [
  // Metrics Category
  {
    id: 'total-users',
    type: 'metric-card',
    name: 'Total Users',
    description: 'Display total user count with trend',
    icon: <Users className="h-4 w-4" />,
    category: 'metrics',
    defaultSize: 'small',
    defaultConfig: {
      title: 'Total Users',
      description: 'Active users in the system',
      icon: <Users className="h-4 w-4" />,
    },
  },
  {
    id: 'revenue',
    type: 'metric-card',
    name: 'Revenue',
    description: 'Display revenue metrics with growth',
    icon: <DollarSign className="h-4 w-4" />,
    category: 'metrics',
    defaultSize: 'small',
    defaultConfig: {
      title: 'Revenue',
      description: 'Total revenue this month',
      icon: <DollarSign className="h-4 w-4" />,
    },
  },
  {
    id: 'conversion-rate',
    type: 'metric-card',
    name: 'Conversion Rate',
    description: 'Track conversion rate performance',
    icon: <Target className="h-4 w-4" />,
    category: 'metrics',
    defaultSize: 'small',
    defaultConfig: {
      title: 'Conversion Rate',
      description: 'Current conversion rate',
      icon: <Target className="h-4 w-4" />,
    },
  },
  
  // Charts Category
  {
    id: 'line-chart',
    type: 'chart',
    name: 'Line Chart',
    description: 'Display trends over time',
    icon: <TrendingUp className="h-4 w-4" />,
    category: 'charts',
    defaultSize: 'medium',
    defaultConfig: {
      title: 'Trend Analysis',
      description: 'Data trends over time',
      icon: <TrendingUp className="h-4 w-4" />,
    },
  },
  {
    id: 'bar-chart',
    type: 'chart',
    name: 'Bar Chart',
    description: 'Compare different categories',
    icon: <BarChart3 className="h-4 w-4" />,
    category: 'charts',
    defaultSize: 'medium',
    defaultConfig: {
      title: 'Category Comparison',
      description: 'Compare data across categories',
      icon: <BarChart3 className="h-4 w-4" />,
    },
  },
  
  // Data Category
  {
    id: 'data-table',
    type: 'table',
    name: 'Data Table',
    description: 'Display tabular data with sorting',
    icon: <Table className="h-4 w-4" />,
    category: 'data',
    defaultSize: 'large',
    defaultConfig: {
      title: 'Data Table',
      description: 'Tabular data display',
      icon: <Table className="h-4 w-4" />,
    },
  },
  {
    id: 'activity-list',
    type: 'list',
    name: 'Activity List',
    description: 'Show recent activities or events',
    icon: <List className="h-4 w-4" />,
    category: 'data',
    defaultSize: 'medium',
    defaultConfig: {
      title: 'Recent Activity',
      description: 'Latest system activities',
      icon: <Activity className="h-4 w-4" />,
    },
  },
  
  // Progress Category
  {
    id: 'progress-tracker',
    type: 'progress',
    name: 'Progress Tracker',
    description: 'Track progress of various metrics',
    icon: <Clock className="h-4 w-4" />,
    category: 'progress',
    defaultSize: 'medium',
    defaultConfig: {
      title: 'Progress Tracker',
      description: 'Track completion progress',
      icon: <Clock className="h-4 w-4" />,
    },
  },
  
  // Alerts Category
  {
    id: 'system-alerts',
    type: 'alert',
    name: 'System Alerts',
    description: 'Display system alerts and notifications',
    icon: <AlertCircle className="h-4 w-4" />,
    category: 'alerts',
    defaultSize: 'medium',
    defaultConfig: {
      title: 'System Alerts',
      description: 'Important system notifications',
      icon: <AlertCircle className="h-4 w-4" />,
    },
  },
  {
    id: 'security-alerts',
    type: 'alert',
    name: 'Security Alerts',
    description: 'Security-related alerts and warnings',
    icon: <Shield className="h-4 w-4" />,
    category: 'alerts',
    defaultSize: 'medium',
    defaultConfig: {
      title: 'Security Alerts',
      description: 'Security notifications and warnings',
      icon: <Shield className="h-4 w-4" />,
    },
  },
  
  // Actions Category
  {
    id: 'quick-actions',
    type: 'quick-actions',
    name: 'Quick Actions',
    description: 'Frequently used action buttons',
    icon: <Zap className="h-4 w-4" />,
    category: 'actions',
    defaultSize: 'small',
    defaultConfig: {
      title: 'Quick Actions',
      description: 'Commonly used actions',
      icon: <Zap className="h-4 w-4" />,
    },
  },
  
  // Activity Category
  {
    id: 'activity-feed',
    type: 'activity-feed',
    name: 'Activity Feed',
    description: 'Real-time activity feed',
    icon: <Globe className="h-4 w-4" />,
    category: 'activity',
    defaultSize: 'medium',
    defaultConfig: {
      title: 'Activity Feed',
      description: 'Real-time system activity',
      icon: <Globe className="h-4 w-4" />,
    },
  },
];

const categories = [
  { id: 'all', name: 'All Widgets', icon: <Activity className="h-4 w-4" /> },
  { id: 'metrics', name: 'Metrics', icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'charts', name: 'Charts', icon: <BarChart3 className="h-4 w-4" /> },
  { id: 'data', name: 'Data', icon: <Table className="h-4 w-4" /> },
  { id: 'progress', name: 'Progress', icon: <Clock className="h-4 w-4" /> },
  { id: 'alerts', name: 'Alerts', icon: <AlertCircle className="h-4 w-4" /> },
  { id: 'actions', name: 'Actions', icon: <Zap className="h-4 w-4" /> },
  { id: 'activity', name: 'Activity', icon: <Globe className="h-4 w-4" /> },
];

export function WidgetLibrary({ onWidgetAdd, className }: WidgetLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isOpen, setIsOpen] = useState(false);

  // Filter widgets based on search and category
  const filteredWidgets = useMemo(() => {
    return defaultWidgetLibrary.filter(widget => {
      const matchesSearch = !searchQuery || 
        widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleAddWidget = (libraryItem: WidgetLibraryItem) => {
    const newWidget: WidgetConfig = {
      id: `${libraryItem.id}-${Date.now()}`,
      type: libraryItem.type,
      title: libraryItem.name,
      description: libraryItem.description,
      size: libraryItem.defaultSize,
      position: {
        x: 0,
        y: 0,
        w: getSizeConfig(libraryItem.defaultSize).w,
        h: getSizeConfig(libraryItem.defaultSize).h,
      },
      ...libraryItem.defaultConfig,
      config: {
        showHeader: true,
        showFooter: false,
        allowResize: true,
        allowMove: true,
        allowRemove: true,
      },
      permissions: {
        view: true,
        edit: true,
        delete: true,
      },
    };

    onWidgetAdd(newWidget);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className={cn('font-expanded', className)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Widget
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="font-expanded">Widget Library</SheetTitle>
          <SheetDescription className="font-semi-expanded">
            Choose from our collection of pre-built widgets to add to your dashboard.
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-4 mt-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 font-semi-expanded"
            />
          </div>
          
          {/* Categories */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4 gap-1">
              {categories.slice(0, 4).map(category => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="text-xs font-semi-expanded"
                >
                  {category.icon}
                  <span className="ml-1 hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsList className="grid w-full grid-cols-4 gap-1 mt-2">
              {categories.slice(4).map(category => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="text-xs font-semi-expanded"
                >
                  {category.icon}
                  <span className="ml-1 hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          {/* Widget Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
            {filteredWidgets.map(widget => (
              <Card key={widget.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-primary">{widget.icon}</span>
                      <CardTitle className="text-sm font-expanded">
                        {widget.name}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs font-semi-expanded">
                      {widget.defaultSize}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground mb-3 font-semi-expanded">
                    {widget.description}
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => handleAddWidget(widget)}
                    className="w-full font-expanded"
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Add Widget
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredWidgets.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground font-expanded">No widgets found</p>
              <p className="text-sm text-muted-foreground font-semi-expanded">
                Try adjusting your search or category filter
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper function to get size configuration
function getSizeConfig(size: WidgetConfig['size']) {
  switch (size) {
    case 'small':
      return { w: 3, h: 3 };
    case 'medium':
      return { w: 4, h: 4 };
    case 'large':
      return { w: 6, h: 4 };
    case 'extra-large':
      return { w: 8, h: 6 };
    default:
      return { w: 4, h: 4 };
  }
}