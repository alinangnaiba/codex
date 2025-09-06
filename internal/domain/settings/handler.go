package settings

type Handler struct {
	service                  *Service
	updateStorageServiceFunc func(string) error
}

func NewHandler(service *Service, updateStorageServiceFunc func(string) error) *Handler {
	return &Handler{
		service:                  service,
		updateStorageServiceFunc: updateStorageServiceFunc,
	}
}

func (h *Handler) GetAll() (map[string]string, error) {
	return h.service.GetAll()
}

func (h *Handler) Get(key string) (string, error) {
	return h.service.Get(key)
}

func (h *Handler) Set(key, value string) error {
	return h.service.Set(key, value)
}

func (h *Handler) SaveBatch(settings map[string]string) error {
	return h.service.SaveBatch(settings, h.updateStorageServiceFunc)
}

func (h *Handler) CheckInitialized() (bool, error) {
	return h.service.CheckInitialized()
}
