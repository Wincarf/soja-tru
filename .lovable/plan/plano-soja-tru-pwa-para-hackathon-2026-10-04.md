# Plano — Soja Tru PWA para hackathon

## Objetivo
Aplicar o design enviado ao projeto e entregar um MVP funcional, convincente e bem acabado. O Soja Tru abrirá diretamente como aplicativo de campo, em inglês, com diagnóstico por IA, cálculo de preço e caderno de safra funcionando mesmo com conexão limitada.

## 1. Experiência principal
- Substituir a página vazia pelo aplicativo mobile-first.
- Criar três áreas principais: **Leaf Diagnosis**, **Fair Price** e **Crop Log**.
- Exibir conexão, disponibilidade offline e quantidade de registros locais sem poluir a tela.
- Usar fluxos simples, botões grandes e textos legíveis em celular Android básico e sob luz intensa.

## 2. Diagnóstico por modelo treinado
- Integrar o modelo treinado **MobileNetV3-Small ONNX**, com 5,83 MB e nove classes de doenças.
- Processar a foto localmente no aparelho, sem enviar a imagem para a nuvem.
- Mostrar o resultado, a confiança e a **acurácia de 96,4%** informada no README.
- Preservar a ordem exata das nove classes esperadas pelo modelo e corrigir apenas os nomes visíveis na interface.
- Usar o limiar de confiança de 65%: abaixo dele, mostrar **“I'm not sure”**, salvar a ocorrência e orientar a procurar assistência técnica.
- Manter o guardrail: a IA sugere, a pessoa decide; nenhuma dose ou defensivo será recomendado.
- Reproduzir os arquivos de áudio enviados exatamente como estão, sem tradução, regravação ou alteração.

## 3. Fair Price Calculator
- Implementar um cálculo transparente com o preço CEPEA armazenado, umidade, impureza, quantidade e oferta do comprador.
- Mostrar preço estimado por saca, total esperado, total oferecido e diferença financeira.
- Apresentar corretamente a arquitetura do projeto: o **modelo treinado atua no diagnóstico visual**; a calculadora utiliza a regra determinística descrita no README e no escopo.
- Mostrar fonte, local de referência e data da cotação; validar entradas e impedir resultados impossíveis.

## 4. Crop Log e fila offline
- Salvar data, tipo e descrição de cada registro no aparelho.
- Salvar fotos incertas com data e localização somente mediante consentimento.
- Listar e permitir excluir registros e fotos pendentes.
- Não simular um envio inexistente: nesta versão, a fila permanecerá local até existir integração com assistência técnica.
- Comprimir fotos antes de armazenar e limitar a fila para proteger celulares com pouco espaço.

## 5. PWA e funcionamento offline
- Tornar o aplicativo instalável, com ícones, nome, cores e abertura em tela independente.
- Disponibilizar offline a interface, o modelo ONNX, o mecanismo de inferência, os áudios e o último preço salvo.
- Atualizar a cotação quando houver conexão, mantendo a última versão disponível quando estiver offline.
- Não depender de CDN externa para executar o diagnóstico.
- Proteger o ambiente de prévia contra caches antigos; validar o modo offline na versão publicada.

## 6. Aplicação do design
- Aplicar a identidade **AgroFamiliar Sustentável** dos arquivos enviados: verde profundo, verde de confirmação, âmbar de atenção, superfícies claras e bordas nítidas.
- Usar **Space Grotesk** nos títulos e **Work Sans** no conteúdo.
- Aproveitar o visual dos simuladores, mas remover a moldura artificial de celular e os painéis técnicos da experiência de campo.
- Usar cartões apenas para resultados e registros, com navegação inferior estável e controles confortáveis para toque.
- Adaptar a composição para tablet e desktop sem transformar o app em página de apresentação.

## 7. Conteúdo técnico para a banca
- Criar uma área secundária e compacta de **Model & Data**, sem competir com o uso principal.
- Apresentar arquitetura, tamanho, nove classes, limiar de 65%, acurácia de 96,4% e erro de 3,6%.
- Incluir os resultados por classe já presentes no README.
- Apresentar as fontes documentadas: Soybean Diseased Leaf Dataset, CEPEA/ESALQ, NASA POWER, Open-Meteo e World Bank.
- Manter as limitações de cobertura dos dados, pois elas fortalecem a transparência da entrega.
- Marcar somente a licença do dataset de imagens como pendente de confirmação, já que o README não informa uma licença concreta.

## 8. Polimento de hackathon
- Padronizar toda a interface em inglês.
- Criar estados completos de carregamento, erro, permissão negada, ausência de registros e indisponibilidade do modelo.
- Corrigir o recorte e a normalização da imagem para corresponder ao treinamento antes da inferência.
- Formatar moeda e datas corretamente, mantendo valores em reais.
- Adicionar testes focados no cálculo de preço, limiar de confiança, mapeamento das nove classes e armazenamento local.
- Incluir metadados próprios do Soja Tru e revisar acessibilidade, contraste e funcionamento em telas pequenas.

## Validação final
- Testar câmera/seleção de imagem, inferência ONNX, cada áudio, fail-safe, cálculo, caderno e fila local.
- Testar recarregamento, instalação e abertura sem conexão.
- Conferir que cada índice do modelo aciona a doença e o áudio corretos.
- Verificar visualmente em celular e desktop, sem textos cortados ou controles sobrepostos.
- Executar os testes do projeto e eliminar erros de execução antes da entrega.

## Fora deste MVP
- Chatbot, previsão de produtividade, cadastro de agricultoras, envio real a técnicos, sincronização em nuvem, novos idiomas e novo treinamento do modelo.
