rm -f helpers.txt

find helpers \
  -type f \
  ! -path "*/node_modules/*" \
  ! -path "*/assets/*" \
  ! -name "*.png" \
  ! -name "*.jpg" \
  ! -name "*.jpeg" \
  ! -name "*.gif" \
  ! -name "*.svg" \
  ! -name "*.ico" \
  ! -name "package-lock.json" \
  | sort | while read file; do

    echo "" >> helpers.txt
    echo "############################################################" >> helpers.txt
    echo "# FILE: $file" >> helpers.txt
    echo "############################################################" >> helpers.txt
    echo "" >> helpers.txt

    cat "$file" >> helpers.txt

    echo -e "\n\n" >> helpers.txt
done