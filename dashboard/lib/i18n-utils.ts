// Simple i18n utilities that don't require next-intl config file

export function useSimpleFormatter(locale: string) {
  return {
    dateTime: (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      return new Intl.DateTimeFormat(locale, options).format(dateObj)
    },
    number: (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(locale, options).format(value)
    },
  }
}
