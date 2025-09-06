package recovery

import (
	"fmt"
	"runtime"
	
	"codex-wails/internal/logger"
)

func HandlePanic(log *logger.Logger) {
	if r := recover(); r != nil {
		// Log the panic
		stack := make([]byte, 4096)
		n := runtime.Stack(stack, false)

		panicMessage := fmt.Sprintf("PANIC: %v\nStack trace:\n%s", r, stack[:n])
		
		if log != nil {
			// Write to logger if available
			log.Error(panicMessage)
		}
		
		// Also write to stdout for immediate visibility during panics
		fmt.Printf("%s\n", panicMessage)
	}
}
