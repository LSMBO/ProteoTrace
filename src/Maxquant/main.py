from Maxquant import Maxquant
import pickle
import argparse
import random, string

parser = argparse.ArgumentParser()
parser.add_argument('-r', help='Maxquant result folder (txt folder)', required=True)
parser.add_argument('-f', help='Database used in the identification search', required=True)
#parser.add_argument('-id', help='Protein id', required=False, action='append')
#parser.add_argument('-o', help='Output file name', required=False)
args = parser.parse_args()

result_folder = args.r
fasta_file = args.f
random_suffix = ''.join(random.choices(string.digits, k=4))
output_file = f"tmp/Maxquant_proteotrace_{random_suffix}.pkl"

maxquant = Maxquant(result_folder, fasta_file)

# Sauvegarder l'objet maxquant dans un fichier pkl en utilisant pickle
with open(output_file, 'wb') as pkl_file:
    pickle.dump(maxquant, pkl_file)


# Pour charger l'objet maxquant depuis le fichier pkl
with open(output_file, 'rb') as pkl_file:
    loaded_maxquant = pickle.load(pkl_file)

loaded_database = loaded_maxquant.sequences
loaded_protein_ids = [sequence["id"] for sequence in loaded_database]
loaded_protein_description = [sequence["description"] for sequence in loaded_database]



# for prot_id in protein_id_list:
#     for protein in maxquant.proteins:
#         if protein.id == prot_id:
#             protein.get_sequence_coverage(output_file=output_file)
#             #protein.get_coverage_stats()

# print(f"The Maxquant Proteotrace run is completed. The results are in {output_file}")