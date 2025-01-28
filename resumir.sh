for file in *.log; do
  tac "$file" | grep -m 1 -C 25 -A 2 "agents";
  echo "========================== $file ===========================";
done
