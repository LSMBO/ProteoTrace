from Proline import Proline
import pickle
import argparse
import random, string

parser = argparse.ArgumentParser()
parser.add_argument('-r', help='Proline excel output file', required=True)
parser.add_argument('-f', help='Database used in the identification search', required=True)
#parser.add_argument('-id', help='Protein id', required=False, action='append')
#parser.add_argument('-o', help='Output file name', required=False)
args = parser.parse_args()

excel_file_path = args.r
fasta_file = args.f
random_suffix = ''.join(random.choices(string.digits, k=4))
output_file = f"tmp/Proline_proteotrace_{random_suffix}.pkl"

proline = Proline(excel_file_path, fasta_file)

# Sauvegarder l'objet proline dans un fichier pkl en utilisant pickle
with open(output_file, 'wb') as pkl_file:
    pickle.dump(proline, pkl_file)


# Pour charger l'objet proline depuis le fichier pkl
with open(output_file, 'rb') as pkl_file:
    loaded_proline = pickle.load(pkl_file)

loaded_database = loaded_proline.sequences
loaded_protein_ids = [sequence["id"] for sequence in loaded_database]
loaded_protein_description = [sequence["description"] for sequence in loaded_database]



# for prot_id in protein_id_list:
#     for protein in proline.proteins:
#         if protein.id == prot_id:
#             protein.get_sequence_coverage(output_file=output_file)
#             #protein.get_coverage_stats()

# print(f"The Proline Proteotrace run is completed. The results are in {output_file}")
    
