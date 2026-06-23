import morgan from 'morgan';

// We can customize the format if needed, 'dev' is a standard morgan format.
export const requestLogger = morgan('dev');
