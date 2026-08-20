# Imagen de contenedor para AWS Lambda (Node.js 20 sobre Amazon Linux 2023).
# Compilar en esta base garantiza que los módulos nativos (bcrypt) y el
# motor de Prisma se generen para el runtime real de Lambda.
FROM public.ecr.aws/lambda/nodejs:20

WORKDIR ${LAMBDA_TASK_ROOT}

# Instala dependencias (incluye compilación nativa de bcrypt).
COPY package*.json ./
RUN npm install

# Copia el código y genera cliente Prisma + build de NestJS.
COPY . .
RUN npx prisma generate && npm run build

# Handler: dist/lambda.handler
CMD ["dist/lambda.handler"]
