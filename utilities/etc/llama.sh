curl -s localhost:11434 | grep -q "Ollama is running"
if [ $? -eq 0 ]; then
  echo "Ollama is already running"
    exit 0
else
  echo "Ollama is not running, starting it now"
fi

ollama serve
