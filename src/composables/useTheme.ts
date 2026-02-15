import { ref, watch, onMounted, type Ref } from 'vue'

const isDark = ref<boolean>(true)

export interface UseThemeReturn {
  isDark: Ref<boolean>
  toggleTheme: () => void
  setTheme: (dark: boolean) => void
}

export function useTheme(): UseThemeReturn {
  const toggleTheme = (): void => {
    isDark.value = !isDark.value
  }

  const setTheme = (dark: boolean): void => {
    isDark.value = dark
  }

  watch(isDark, (newValue: boolean) => {
    if (newValue) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  })

  onMounted(() => {
    const savedTheme = localStorage.getItem('theme')
    isDark.value = savedTheme ? savedTheme === 'dark' : true
  })

  return {
    isDark,
    toggleTheme,
    setTheme,
  }
}
