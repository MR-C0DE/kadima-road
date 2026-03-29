rm -f projet-complet.txt

find backend helpers mobile \
  -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/uploads/*" \
  ! -path "*/logs/*" \
  ! -path "*/assets/*" \
  ! -name "*.png" \
  ! -name "*.jpg" \
  ! -name "*.jpeg" \
  ! -name "*.gif" \
  ! -name "*.svg" \
  ! -name "*.ico" \
  ! -name "*.pdf" \
  ! -name "package-lock.json" \
  ! -name "*.log" \
  | sort | while read file; do

    echo "" >> projet-complet.txt
    echo "############################################################" >> projet-complet.txt
    echo "# FILE: $file" >> projet-complet.txt
    echo "############################################################" >> projet-complet.txt
    echo "" >> projet-complet.txt

    cat "$file" >> projet-complet.txt

    echo -e "\n\n" >> projet-complet.txt
done