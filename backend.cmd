rm -f backend.txt

find backend \
  -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/uploads/*" \
  ! -path "*/logs/*" \
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

    echo "" >> backend.txt
    echo "############################################################" >> backend.txt
    echo "# FILE: $file" >> backend.txt
    echo "############################################################" >> backend.txt
    echo "" >> backend.txt

    cat "$file" >> backend.txt

    echo -e "\n\n" >> backend.txt
done