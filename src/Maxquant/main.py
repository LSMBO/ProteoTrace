from Maxquant import Maxquant
from Bio import SeqIO
import argparse
import random, string

parser = argparse.ArgumentParser()
parser.add_argument('-r', help='Maxquant result folder (txt folder)', required=True)
parser.add_argument('-f', help='Database used in the identification search', required=True)
parser.add_argument('-id', help='Protein id', required=False, action='append')
parser.add_argument('-o', help='Output file name', required=False)
args = parser.parse_args()

def get_fasta_ids(fasta_file):
    ids = []
    for record in SeqIO.parse(fasta_file, "fasta"):
        ids.append(record.id)
    return ids

#result_folder = 'Manip4_alltissue'
result_folder = args.r
#fasta_file = 'Defensin_like_all.fasta'
fasta_file = args.f

if args.o:
    output_file = args.o
else:
    random_suffix = ''.join(random.choices(string.digits, k=4))
    output_file = f"Maxquant_proteotrace_{random_suffix}.fasta"
    
if args.id:
    protein_id_list = args.id
else:
    protein_id_list = get_fasta_ids(fasta_file)

maxquant = Maxquant(result_folder, fasta_file)

for prot_id in protein_id_list:
    for protein in maxquant.proteins:
        if protein.id == prot_id:
            protein.get_sequence_coverage(output_file=output_file)
            #protein.get_coverage_stats()

print(f"The Maxquant Proteotrace run is completed. The results are in {output_file}")