rm -f mobile.txt

find mobile \
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

    echo "" >> mobile.txt
    echo "############################################################" >> mobile.txt
    echo "# FILE: $file" >> mobile.txt
    echo "############################################################" >> mobile.txt
    echo "" >> mobile.txt

    cat "$file" >> mobile.txt

    echo -e "\n\n" >> mobile.txt
done