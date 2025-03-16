import { render, screen } from '../utils/test-utils';
import { AthleteStats } from '@/components/dashboard/AthleteStats';

// Mock the data that would normally come from the API
jest.mock('@/hooks/usePerformance', () => ({
  usePerformanceMetrics: () => ({
    data: {
      trainingLoad: {
        value: 85.7,
        diff: 10.2,
        unit: 'CTL',
      },
      formScore: {
        value: -9.5,
        diff: -15.3,
        unit: 'TSB',
      },
      strength: {
        value: 150,
        diff: 5.0,
        unit: 'kg',
      },
      speed: {
        value: 4.1,
        diff: 2.5,
        unit: 'sec',
      },
      readinessScore: 78,
    },
    isLoading: false,
    error: null,
  }),
}));

describe('AthleteStats', () => {
  test('renders the component with stats', () => {
    render(<AthleteStats athleteId={1} />);
    
    // Check that the title is present
    expect(screen.getByText('Performance Overview')).toBeInTheDocument();
    
    // Check that the stats are displayed
    expect(screen.getByText('Training Load')).toBeInTheDocument();
    expect(screen.getByText('85.7')).toBeInTheDocument();
    expect(screen.getByText('CTL')).toBeInTheDocument();
    
    expect(screen.getByText('Form Score')).toBeInTheDocument();
    expect(screen.getByText('-9.5')).toBeInTheDocument();
    expect(screen.getByText('TSB')).toBeInTheDocument();
    
    expect(screen.getByText('Squat 1RM')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('kg')).toBeInTheDocument();
    
    expect(screen.getByText('30m Sprint')).toBeInTheDocument();
    expect(screen.getByText('4.1')).toBeInTheDocument();
    expect(screen.getByText('sec')).toBeInTheDocument();
    
    // Check readiness score
    expect(screen.getByText('Athlete Readiness')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
  });
  
  test('shows positive and negative trends correctly', () => {
    render(<AthleteStats athleteId={1} />);
    
    // Check positive trends
    expect(screen.getByText('+10.2%')).toBeInTheDocument();
    expect(screen.getByText('+5%')).toBeInTheDocument();
    
    // Check negative trends
    expect(screen.getByText('-15.3%')).toBeInTheDocument();
  });
});
