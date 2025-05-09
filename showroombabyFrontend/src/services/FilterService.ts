import { EventRegister } from 'react-native-event-listeners';

// Type pour les filtres
export interface Filters {
  category: number | null;
  subcategory: number | null;
  condition: string | null;
  sellerType: string | null;
  minPrice: number;
  maxPrice: number;
}

// Valeurs par défaut
const defaultFilters: Filters = {
  category: null,
  subcategory: null,
  condition: null,
  sellerType: null,
  minPrice: 0,
  maxPrice: 1000
};

// Classe singleton pour gérer l'état des filtres
class FilterService {
  private static instance: FilterService;
  private _activeFilters: Filters = {...defaultFilters};
  private eventName = 'FILTERS_CHANGED';

  private constructor() {
    // Constructeur privé pour s'assurer qu'il n'y a qu'une seule instance
  }

  public static getInstance(): FilterService {
    if (!FilterService.instance) {
      FilterService.instance = new FilterService();
    }
    return FilterService.instance;
  }

  // Obtenir les filtres actifs
  public getFilters(): Filters {
    return {...this._activeFilters};
  }

  // Définir de nouveaux filtres
  public setFilters(filters: Partial<Filters>): void {
    // Fusionner les nouveaux filtres avec les filtres existants
    this._activeFilters = {
      ...this._activeFilters,
      ...filters
    };
    
    console.log('FilterService: Nouveaux filtres définis', this._activeFilters);
    
    // Émettre un événement pour informer les abonnés du changement
    EventRegister.emit(this.eventName, this._activeFilters);
  }

  // Réinitialiser les filtres
  public resetFilters(): void {
    this._activeFilters = {...defaultFilters};
    console.log('FilterService: Filtres réinitialisés');
    EventRegister.emit(this.eventName, this._activeFilters);
  }

  // S'abonner aux changements de filtres
  public subscribe(callback: (filters: Filters) => void): string {
    return EventRegister.addEventListener(this.eventName, callback) as string;
  }

  // Se désabonner des changements
  public unsubscribe(listenerId: string): void {
    EventRegister.removeEventListener(listenerId);
  }
}

export default FilterService.getInstance(); 